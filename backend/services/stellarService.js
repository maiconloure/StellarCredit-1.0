/**
 * Stellar Service - Integração com a rede Stellar
 * Responsável por interações diretas com Horizon API e validações
 */

const StellarSdk = require('@stellar/stellar-sdk');
const { Keypair, Networks, Asset, Operation, TransactionBuilder, Account } = StellarSdk;
const logger = require('../utils/logger');

class StellarService {
  constructor() {
    this.server = null;
    this.network = process.env.STELLAR_NETWORK || 'testnet';
    this.horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.networkPassphrase = this.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
  }

  async initialize() {
    try {
      this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
      
      // Testar conexão
      await this.server.ledgers().order('desc').limit(1).call();
      
      logger.info(`Stellar Service inicializado na rede: ${this.network}`);
      logger.info(`Horizon URL: ${this.horizonUrl}`);
    } catch (error) {
      logger.error(`Erro ao inicializar Stellar Service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valida se um endereço Stellar é válido
   */
  isValidStellarAddress(address) {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca dados completos da carteira
   */
  async getWalletData(address, network = null) {
    try {
      const targetNetwork = network || this.network;
      const server = network && network !== this.network ? 
        new Server(network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org') :
        this.server;

      // 1. Buscar informações da conta
      let accountData;
      try {
        accountData = await server.loadAccount(address);
      } catch (error) {
        if (error.response?.status === 404) {
          return {
            exists: false,
            address,
            balances: [],
            transactions: [],
            operations: [],
            sequence: '0'
          };
        }
        throw error;
      }

      // 2. Buscar transações recentes
      const transactions = await this.getTransactionHistory(address, 100, null, server);

      // 3. Buscar operações
      const operations = await this.getOperations(address, 200, server);

      // 4. Processar saldos
      const balances = accountData.balances.map(balance => ({
        asset_type: balance.asset_type,
        asset_code: balance.asset_code,
        asset_issuer: balance.asset_issuer,
        balance: parseFloat(balance.balance),
        limit: balance.limit ? parseFloat(balance.limit) : null,
        buying_liabilities: parseFloat(balance.buying_liabilities || 0),
        selling_liabilities: parseFloat(balance.selling_liabilities || 0)
      }));

      return {
        exists: true,
        address,
        sequence: accountData.sequence,
        subentry_count: accountData.subentry_count,
        balances,
        transactions,
        operations,
        signers: accountData.signers,
        data: accountData.data_attr || {},
        flags: accountData.flags,
        thresholds: accountData.thresholds,
        home_domain: accountData.home_domain,
        created_at: transactions.length > 0 ? 
          transactions[transactions.length - 1].created_at : 
          new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Erro ao buscar dados da carteira ${address}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca histórico de transações
   */
  async getTransactionHistory(address, limit = 50, cursor = null, server = null) {
    try {
      const targetServer = server || this.server;
      
      let builder = targetServer.transactions()
        .forAccount(address)
        .order('desc')
        .limit(Math.min(limit, 200));

      if (cursor) {
        builder = builder.cursor(cursor);
      }

      const response = await builder.call();
      
      const transactions = response.records.map(tx => ({
        id: tx.id,
        hash: tx.hash,
        ledger: tx.ledger_attr,
        created_at: tx.created_at,
        source_account: tx.source_account,
        fee_paid: parseInt(tx.fee_paid),
        operation_count: tx.operation_count,
        envelope_xdr: tx.envelope_xdr,
        result_xdr: tx.result_xdr,
        result_meta_xdr: tx.result_meta_xdr,
        memo_type: tx.memo_type,
        memo: tx.memo,
        successful: tx.successful,
        paging_token: tx.paging_token
      }));

      return {
        records: transactions,
        next_cursor: response.records.length > 0 ? 
          response.records[response.records.length - 1].paging_token : 
          null,
        prev_cursor: response.records.length > 0 ? 
          response.records[0].paging_token : 
          null
      };

    } catch (error) {
      logger.error(`Erro ao buscar histórico de transações: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca operações da conta
   */
  async getOperations(address, limit = 100, server = null) {
    try {
      const targetServer = server || this.server;
      
      const response = await targetServer.operations()
        .forAccount(address)
        .order('desc')
        .limit(Math.min(limit, 200))
        .call();

      return response.records.map(op => ({
        id: op.id,
        type: op.type,
        type_i: op.type_i,
        created_at: op.created_at,
        transaction_hash: op.transaction_hash,
        source_account: op.source_account,
        ...this.extractOperationDetails(op)
      }));

    } catch (error) {
      logger.error(`Erro ao buscar operações: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrai detalhes específicos de cada tipo de operação
   */
  extractOperationDetails(operation) {
    const details = {};

    switch (operation.type) {
      case 'payment':
        details.from = operation.from;
        details.to = operation.to;
        details.amount = parseFloat(operation.amount);
        details.asset_type = operation.asset_type;
        details.asset_code = operation.asset_code;
        details.asset_issuer = operation.asset_issuer;
        break;

      case 'path_payment_strict_send':
      case 'path_payment_strict_receive':
        details.from = operation.from;
        details.to = operation.to;
        details.amount = parseFloat(operation.amount);
        details.source_amount = parseFloat(operation.source_amount);
        details.asset_type = operation.asset_type;
        details.asset_code = operation.asset_code;
        details.asset_issuer = operation.asset_issuer;
        details.source_asset_type = operation.source_asset_type;
        details.source_asset_code = operation.source_asset_code;
        details.source_asset_issuer = operation.source_asset_issuer;
        break;

      case 'create_account':
        details.account = operation.account;
        details.funder = operation.funder;
        details.starting_balance = parseFloat(operation.starting_balance);
        break;

      case 'account_merge':
        details.account = operation.account;
        details.into = operation.into;
        break;

      case 'manage_buy_offer':
      case 'manage_sell_offer':
        details.amount = parseFloat(operation.amount);
        details.price = operation.price;
        details.offer_id = operation.offer_id;
        details.buying_asset_type = operation.buying_asset_type;
        details.buying_asset_code = operation.buying_asset_code;
        details.buying_asset_issuer = operation.buying_asset_issuer;
        details.selling_asset_type = operation.selling_asset_type;
        details.selling_asset_code = operation.selling_asset_code;
        details.selling_asset_issuer = operation.selling_asset_issuer;
        break;

      case 'change_trust':
        details.trustee = operation.trustee;
        details.trustor = operation.trustor;
        details.limit = operation.limit;
        details.asset_type = operation.asset_type;
        details.asset_code = operation.asset_code;
        details.asset_issuer = operation.asset_issuer;
        break;
    }

    return details;
  }

  /**
   * Calcula métricas financeiras básicas
   */
  async calculateWalletMetrics(address, walletData) {
    try {
      const { transactions, operations, balances } = walletData;
      
      // Filtrar últimos 3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentOperations = operations.filter(op => 
        new Date(op.created_at) > threeMonthsAgo
      );

      const recentTransactions = transactions.records.filter(tx => 
        new Date(tx.created_at) > threeMonthsAgo
      );

      // 1. Volume total (em USD equivalente)
      let totalVolume = 0;
      let paymentCount = 0;
      let receiveCount = 0;

      recentOperations.forEach(op => {
        if (op.type === 'payment') {
          const amount = this.convertToUSD(op.amount, op.asset_type, op.asset_code);
          totalVolume += amount;
          
          if (op.from === address) {
            paymentCount++;
          } else {
            receiveCount++;
          }
        }
      });

      // 2. Frequência de uso
      const daysSinceFirstTx = recentTransactions.length > 0 ? 
        (Date.now() - new Date(recentTransactions[recentTransactions.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24) :
        0;
      
      const usageFrequency = daysSinceFirstTx > 0 ? 
        (recentTransactions.length / daysSinceFirstTx) * 30 : // tx por mês
        0;

      // 3. Pontualidade (% de transações bem-sucedidas)
      const successfulTx = recentTransactions.filter(tx => tx.successful).length;
      const punctuality = recentTransactions.length > 0 ? 
        successfulTx / recentTransactions.length : 
        0;

      // 4. Diversificação
      const uniqueAssets = new Set();
      const uniqueOperationTypes = new Set();
      const uniqueCounterparts = new Set();

      recentOperations.forEach(op => {
        uniqueOperationTypes.add(op.type);
        
        if (op.asset_code) {
          uniqueAssets.add(op.asset_code);
        }
        if (op.asset_type === 'native') {
          uniqueAssets.add('XLM');
        }

        if (op.from && op.from !== address) {
          uniqueCounterparts.add(op.from);
        }
        if (op.to && op.to !== address) {
          uniqueCounterparts.add(op.to);
        }
      });

      const diversificationScore = (
        Math.min(uniqueAssets.size / 3, 1) * 0.4 +
        Math.min(uniqueOperationTypes.size / 5, 1) * 0.3 +
        Math.min(uniqueCounterparts.size / 10, 1) * 0.3
      );

      // 5. Saldo médio estimado
      const currentBalance = balances.reduce((total, balance) => {
        return total + this.convertToUSD(balance.balance, balance.asset_type, balance.asset_code);
      }, 0);

      // 6. Idade da conta
      const accountAge = daysSinceFirstTx;
      const ageScore = Math.min(accountAge / 365, 1); // Normalizar para 1 ano

      return {
        total_volume_3m: totalVolume,
        transaction_count_3m: recentOperations.length,
        avg_balance: currentBalance,
        payment_punctuality: punctuality,
        usage_frequency: usageFrequency,
        diversification_score: diversificationScore,
        age_score: ageScore,
        network_activity: Math.min(uniqueCounterparts.size / 20, 1),
        payment_ratio: paymentCount / Math.max(paymentCount + receiveCount, 1),
        unique_assets: uniqueAssets.size,
        unique_counterparts: uniqueCounterparts.size
      };

    } catch (error) {
      logger.error(`Erro ao calcular métricas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converte valor para USD (simplificado)
   */
  convertToUSD(amount, assetType, assetCode) {
    const value = parseFloat(amount);
    
    if (assetType === 'native') {
      // XLM - usar cotação simplificada
      return value * 0.12; // ~$0.12 por XLM
    }
    
    // Stablecoins comuns
    const stablecoins = ['USDC', 'USDT', 'BUSD', 'DAI'];
    if (stablecoins.includes(assetCode)) {
      return value;
    }
    
    // Outros assets - estimativa conservadora
    return value * 0.5;
  }

  /**
   * Submete transação para a rede
   */
  async submitTransaction(transactionXdr, network = null) {
    try {
      const targetNetwork = network || this.network;
      const server = network && network !== this.network ? 
        new Server(network === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org') :
        this.server;

      const result = await server.submitTransaction(transactionXdr);
      
      logger.info(`Transação submetida com sucesso: ${result.hash}`);
      return result;
      
    } catch (error) {
      logger.error(`Erro ao submeter transação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria keypair aleatório (para testes)
   */
  generateKeypair() {
    return Keypair.random();
  }

  /**
   * Busca informações de um ledger específico
   */
  async getLedgerInfo(sequence) {
    try {
      return await this.server.ledgers().ledger(sequence).call();
    } catch (error) {
      logger.error(`Erro ao buscar ledger ${sequence}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitora eventos da rede em tempo real
   */
  watchPayments(address, callback) {
    const eventSource = this.server.payments()
      .forAccount(address)
      .cursor('now')
      .stream({
        onmessage: callback,
        onerror: (error) => {
          logger.error(`Erro no stream de pagamentos: ${error}`);
        }
      });

    return eventSource;
  }
}

module.exports = new StellarService();
