#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec
};

pub const DAY_IN_LEDGERS: u32 = 17280; // Aproximadamente 24 horas
pub const PRECISION: u32 = 1000000; // Para cálculos decimais com 6 casas

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreditScore {
    pub address: Address,
    pub score: u32,           // Score de 0 a 1000
    pub last_updated: u32,    // Ledger timestamp
    pub transaction_volume: u32,  // Volume em últimos 3 meses (em USDC * PRECISION)
    pub payment_punctuality: u32, // % pontualidade (0-100)
    pub usage_frequency: u32,     // Transações por mês
    pub diversification: u32,     // Score de diversificação (0-100)
    pub avg_balance: u32,         // Saldo médio (em USDC * PRECISION)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanOffer {
    pub id: u32,
    pub borrower: Address,
    pub amount: u32,          // Valor em USDC * PRECISION
    pub interest_rate: u32,   // Taxa mensal em % * PRECISION
    pub duration_months: u32,
    pub status: Symbol,       // PENDING, APPROVED, REJECTED, COMPLETED
    pub created_at: u32,
    pub required_score: u32,
}

#[contracttype]
pub enum DataKey {
    Score(Address),
    Loan(u32),
    LoanCounter,
    AdminAddress,
}

const SCORE_WEIGHTS: [u32; 5] = [20, 30, 15, 20, 15]; // Pesos das métricas em %

#[contract]
pub struct StellarCreditContract;

#[contractimpl]
impl StellarCreditContract {
    
    /// Inicializa o contrato com endereço do administrador
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::AdminAddress, &admin);
        env.storage().instance().set(&DataKey::LoanCounter, &0u32);
    }

    /// Armazena ou atualiza o score de crédito de um usuário
    pub fn store_score(
        env: Env,
        address: Address,
        transaction_volume: u32,
        payment_punctuality: u32,
        usage_frequency: u32,
        diversification: u32,
        avg_balance: u32,
    ) -> u32 {
        address.require_auth();

        let current_ledger = env.ledger().sequence();
        
        // Calcula o score final usando os pesos definidos
        let score = Self::calculate_score(
            transaction_volume,
            payment_punctuality,
            usage_frequency,
            diversification,
            avg_balance,
        );

        let credit_score = CreditScore {
            address: address.clone(),
            score,
            last_updated: current_ledger,
            transaction_volume,
            payment_punctuality,
            usage_frequency,
            diversification,
            avg_balance,
        };

        env.storage().persistent().set(&DataKey::Score(address.clone()), &credit_score);
        
        // Extende TTL para 1 ano (aproximadamente)
        env.storage().persistent().extend_ttl(&DataKey::Score(address.clone()), 365 * DAY_IN_LEDGERS, 365 * DAY_IN_LEDGERS);

        score
    }

    /// Recupera o score de crédito de um usuário
    pub fn get_score(env: Env, address: Address) -> Option<CreditScore> {
        env.storage().persistent().get(&DataKey::Score(address))
    }

    /// Solicita um empréstimo baseado no score
    pub fn request_loan(
        env: Env,
        borrower: Address,
        amount: u32,
        duration_months: u32,
    ) -> u32 {
        borrower.require_auth();

        // Verifica se o usuário tem score válido
        let score_data: CreditScore = match env.storage().persistent()
            .get(&DataKey::Score(borrower.clone())) {
            Some(data) => data,
            None => panic!("Usuario nao possui score"),
        };

        // Determina taxa de juros baseada no score
        let interest_rate = Self::calculate_interest_rate(score_data.score);
        let max_amount = Self::calculate_max_loan_amount(score_data.score);

        // Verifica se o valor solicitado está dentro do limite
        if amount > max_amount {
            panic!("Valor excede o limite");
        }

        // Cria nova solicitação de empréstimo
        let loan_counter: u32 = env.storage().instance()
            .get(&DataKey::LoanCounter)
            .unwrap_or(0);
        
        let new_loan_id = loan_counter + 1;

        let loan_offer = LoanOffer {
            id: new_loan_id,
            borrower: borrower.clone(),
            amount,
            interest_rate,
            duration_months,
            status: symbol_short!("PENDING"),
            created_at: env.ledger().sequence(),
            required_score: score_data.score,
        };

        env.storage().persistent().set(&DataKey::Loan(new_loan_id), &loan_offer);
        env.storage().instance().set(&DataKey::LoanCounter, &new_loan_id);

        // Auto-aprovação para scores altos
        if score_data.score >= 700 {
            // Auto-aprovação não implementada por simplicidade
        }

        new_loan_id
    }

    /// Aprova um empréstimo (função administrativa)
    pub fn approve_loan(env: Env, loan_id: u32) {
        let admin: Address = match env.storage().instance()
            .get(&DataKey::AdminAddress) {
            Some(addr) => addr,
            None => panic!("Admin nao configurado"),
        };
        admin.require_auth();

        let mut loan: LoanOffer = match env.storage().persistent()
            .get(&DataKey::Loan(loan_id)) {
            Some(loan) => loan,
            None => panic!("Emprestimo nao encontrado"),
        };

        if loan.status != symbol_short!("PENDING") {
            panic!("Status invalido");
        }

        loan.status = symbol_short!("APPROVED");
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
    }

    /// Rejeita um empréstimo (função administrativa)
    pub fn reject_loan(env: Env, loan_id: u32) {
        let admin: Address = match env.storage().instance()
            .get(&DataKey::AdminAddress) {
            Some(addr) => addr,
            None => panic!("Admin nao configurado"),
        };
        admin.require_auth();

        let mut loan: LoanOffer = match env.storage().persistent()
            .get(&DataKey::Loan(loan_id)) {
            Some(loan) => loan,
            None => panic!("Emprestimo nao encontrado"),
        };

        if loan.status != symbol_short!("PENDING") {
            panic!("Status invalido");
        }

        loan.status = symbol_short!("REJECTED");
        env.storage().persistent().set(&DataKey::Loan(loan_id), &loan);
    }

    /// Recupera informações de um empréstimo
    pub fn get_loan(env: Env, loan_id: u32) -> Option<LoanOffer> {
        env.storage().persistent().get(&DataKey::Loan(loan_id))
    }

    /// Lista ofertas de empréstimo disponíveis para um score específico
    pub fn get_loan_offers(env: Env, score: u32) -> Vec<(u32, u32, u32)> {
        let mut offers = Vec::new(&env);
        
        // Ofertas baseadas no score
        if score >= 700 {
            offers.push_back((1000 * PRECISION, 2 * PRECISION / 100, 12)); // $1000, 2%/mês, 12 meses
            offers.push_back((500 * PRECISION, 2 * PRECISION / 100, 6));   // $500, 2%/mês, 6 meses
        } else if score >= 500 {
            offers.push_back((500 * PRECISION, 4 * PRECISION / 100, 12));  // $500, 4%/mês, 12 meses
            offers.push_back((200 * PRECISION, 4 * PRECISION / 100, 6));   // $200, 4%/mês, 6 meses
        } else if score >= 300 {
            offers.push_back((200 * PRECISION, 6 * PRECISION / 100, 6));   // $200, 6%/mês, 6 meses
            offers.push_back((100 * PRECISION, 6 * PRECISION / 100, 3));   // $100, 6%/mês, 3 meses
        }

        offers
    }

    // === FUNÇÕES INTERNAS ===

    /// Calcula o score final baseado nas métricas ponderadas
    fn calculate_score(
        volume: u32,
        punctuality: u32,
        frequency: u32,
        diversification: u32,
        balance: u32,
    ) -> u32 {
        // Normaliza as métricas para 0-100
        let normalized_volume = Self::normalize_volume(volume);
        let normalized_frequency = Self::normalize_frequency(frequency);
        let normalized_balance = Self::normalize_balance(balance);

        // Aplica os pesos
        let weighted_sum = 
            (normalized_volume * SCORE_WEIGHTS[0]) +
            (punctuality * SCORE_WEIGHTS[1]) +
            (normalized_frequency * SCORE_WEIGHTS[2]) +
            (diversification * SCORE_WEIGHTS[3]) +
            (normalized_balance * SCORE_WEIGHTS[4]);

        // Converte para escala 0-1000
        (weighted_sum / 100) * 10
    }

    fn normalize_volume(volume: u32) -> u32 {
        // Normaliza volume de transações (0-10000 USDC -> 0-100)
        let max_volume = 10000u64 * PRECISION as u64;
        if volume as u64 >= max_volume { 100 } else { ((volume as u64 * 100) / max_volume) as u32 }
    }

    fn normalize_frequency(frequency: u32) -> u32 {
        // Normaliza frequência (0-50 transações/mês -> 0-100)
        if frequency >= 50 { 100 } else { (frequency * 100) / 50 }
    }

    fn normalize_balance(balance: u32) -> u32 {
        // Normaliza saldo médio (0-5000 USDC -> 0-100)
        let max_balance = 5000u64 * PRECISION as u64;
        if balance as u64 >= max_balance { 100 } else { ((balance as u64 * 100) / max_balance) as u32 }
    }

    fn calculate_interest_rate(score: u32) -> u32 {
        if score >= 700 {
            2 * PRECISION / 100 // 2% ao mês
        } else if score >= 500 {
            4 * PRECISION / 100 // 4% ao mês
        } else if score >= 300 {
            6 * PRECISION / 100 // 6% ao mês
        } else {
            10 * PRECISION / 100 // 10% ao mês (alto risco)
        }
    }

    fn calculate_max_loan_amount(score: u32) -> u32 {
        if score >= 700 {
            1000 * PRECISION // $1000
        } else if score >= 500 {
            500 * PRECISION  // $500
        } else if score >= 300 {
            200 * PRECISION  // $200
        } else {
            0                // Não elegível
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_score_calculation() {
        let env = Env::default();
        let contract_id = env.register_contract(None, StellarCreditContract);
        let client = StellarCreditContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        // Inicializa o contrato
        client.initialize(&admin);

        // Testa cálculo de score
        let score = client.store_score(
            &user,
            &(5000 * PRECISION),  // volume: $5000
            &95,                  // punctuality: 95%
            &25,                  // frequency: 25 tx/mês
            &80,                  // diversification: 80%
            &(1000 * PRECISION),  // balance: $1000
        );

        assert!(score > 700); // Deve ser um bom score

        // Verifica se o score foi armazenado
        let stored_score = client.get_score(&user).unwrap();
        assert_eq!(stored_score.score, score);
        assert_eq!(stored_score.address, user);
    }

    #[test]
    fn test_loan_request() {
        let env = Env::default();
        let contract_id = env.register_contract(None, StellarCreditContract);
        let client = StellarCreditContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        // Cria um score alto para o usuário
        client.store_score(&user, &(8000 * PRECISION), &95, &30, &85, &(1500 * PRECISION));

        // Solicita empréstimo
        let loan_id = client.request_loan(&user, &(500 * PRECISION), &6).unwrap();

        // Verifica se o empréstimo foi criado
        let loan = client.get_loan(&loan_id).unwrap();
        assert_eq!(loan.borrower, user);
        assert_eq!(loan.amount, 500 * PRECISION);
        assert_eq!(loan.status, symbol_short!("APPROVED")); // Auto-aprovado para score alto
    }

    #[test]
    fn test_loan_offers() {
        let env = Env::default();
        let contract_id = env.register_contract(None, StellarCreditContract);
        let client = StellarCreditContractClient::new(&env, &contract_id);

        // Testa ofertas para diferentes scores
        let offers_high = client.get_loan_offers(&750);
        assert_eq!(offers_high.len(), 2);

        let offers_medium = client.get_loan_offers(&550);
        assert_eq!(offers_medium.len(), 2);

        let offers_low = client.get_loan_offers(&350);
        assert_eq!(offers_low.len(), 2);

        let offers_very_low = client.get_loan_offers(&250);
        assert_eq!(offers_very_low.len(), 0);
    }
}
