"""
Stellar Credit - Sistema de IA para Análise de Score de Crédito
Algoritmo avançado que analisa transações on-chain da Stellar para calcular score de crédito
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import json
import logging
from stellar_sdk import Server, Account, Asset, TransactionBuilder
from stellar_sdk.exceptions import NotFoundError

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TransactionData:
    """Estrutura de dados para transações Stellar"""
    id: str
    type: str  # payment, receive, path_payment, etc.
    amount: float
    asset: str
    from_address: str
    to_address: str
    timestamp: datetime
    successful: bool
    memo: Optional[str] = None

@dataclass
class WalletMetrics:
    """Métricas calculadas da carteira"""
    total_volume_3m: float
    transaction_count_3m: int
    avg_balance: float
    payment_punctuality: float  # 0-1
    usage_frequency: float      # transações por mês
    diversification_score: float # 0-1
    age_score: float           # 0-1 baseado na idade da carteira
    network_activity: float    # 0-1 baseado em interações únicas

@dataclass
class CreditScore:
    """Score final de crédito"""
    score: int              # 0-1000
    metrics: WalletMetrics
    risk_level: str         # LOW, MEDIUM, HIGH
    max_loan_amount: float
    interest_rate: float
    recommendations: List[str]

class StellarCreditAI:
    """
    Sistema de IA para análise de crédito baseado em transações Stellar
    """
    
    # Pesos para cálculo do score final
    WEIGHTS = {
        'volume': 0.20,           # Volume de transações (20%)
        'punctuality': 0.30,      # Pontualidade de pagamentos (30%)
        'frequency': 0.15,        # Frequência de uso (15%)
        'diversification': 0.20,  # Diversificação de transações (20%)
        'balance': 0.15           # Saldo médio mantido (15%)
    }
    
    # Limites para normalização
    NORMALIZATION_LIMITS = {
        'max_volume': 50000,      # $50k máximo para score 100
        'max_frequency': 100,     # 100 transações/mês máximo
        'max_balance': 10000,     # $10k saldo médio máximo
        'min_age_days': 30,       # Mínimo 30 dias para score completo
        'optimal_age_days': 365   # 1 ano para score ótimo de idade
    }
    
    def __init__(self, stellar_network: str = "testnet"):
        """
        Inicializa o sistema de IA
        
        Args:
            stellar_network: "testnet" ou "mainnet"
        """
        self.network = stellar_network
        if stellar_network == "testnet":
            self.server = Server("https://horizon-testnet.stellar.org")
        else:
            self.server = Server("https://horizon.stellar.org")
        
        logger.info(f"Stellar Credit AI inicializado na rede: {stellar_network}")
    
    async def analyze_wallet(self, address: str) -> CreditScore:
        """
        Análise completa de uma carteira Stellar
        
        Args:
            address: Endereço da carteira Stellar
            
        Returns:
            CreditScore: Score calculado com métricas detalhadas
        """
        try:
            logger.info(f"Iniciando análise da carteira: {address}")
            
            # 1. Buscar dados de transações
            transactions = await self._fetch_wallet_transactions(address)
            
            if not transactions:
                return self._create_new_user_score()
            
            # 2. Calcular métricas da carteira
            metrics = self._calculate_wallet_metrics(transactions, address)
            
            # 3. Calcular score final
            score = self._calculate_credit_score(metrics)
            
            # 4. Determinar ofertas de empréstimo
            risk_level, max_loan, interest_rate = self._determine_loan_terms(score)
            
            # 5. Gerar recomendações
            recommendations = self._generate_recommendations(metrics, score)
            
            credit_score = CreditScore(
                score=score,
                metrics=metrics,
                risk_level=risk_level,
                max_loan_amount=max_loan,
                interest_rate=interest_rate,
                recommendations=recommendations
            )
            
            logger.info(f"Análise concluída. Score: {score}, Risk: {risk_level}")
            return credit_score
            
        except Exception as e:
            logger.error(f"Erro na análise da carteira {address}: {str(e)}")
            raise
    
    async def _fetch_wallet_transactions(self, address: str, limit: int = 200) -> List[TransactionData]:
        """
        Busca transações da carteira nos últimos 3 meses
        """
        transactions = []
        three_months_ago = datetime.now() - timedelta(days=90)
        
        try:
            # Buscar operações da conta
            operations = self.server.operations().for_account(address).limit(limit).call()
            
            for op in operations['_embedded']['records']:
                # Filtrar apenas últimos 3 meses
                op_date = datetime.fromisoformat(op['created_at'].replace('Z', '+00:00'))
                if op_date < three_months_ago:
                    continue
                
                # Processar diferentes tipos de operações
                if op['type'] in ['payment', 'path_payment_strict_send', 'path_payment_strict_receive']:
                    transaction = self._parse_payment_operation(op, address)
                    if transaction:
                        transactions.append(transaction)
            
            logger.info(f"Encontradas {len(transactions)} transações relevantes")
            return transactions
            
        except NotFoundError:
            logger.warning(f"Conta não encontrada: {address}")
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar transações: {str(e)}")
            return []
    
    def _parse_payment_operation(self, operation: dict, wallet_address: str) -> Optional[TransactionData]:
        """
        Converte operação Stellar em TransactionData
        """
        try:
            op_type = operation['type']
            timestamp = datetime.fromisoformat(operation['created_at'].replace('Z', '+00:00'))
            
            # Determinar direção da transação
            if op_type == 'payment':
                from_addr = operation['from']
                to_addr = operation['to']
                amount = float(operation['amount'])
                asset = operation['asset_type']
                
                # Determinar se é envio ou recebimento
                tx_type = 'payment' if from_addr == wallet_address else 'receive'
                
            elif 'path_payment' in op_type:
                from_addr = operation['from']
                to_addr = operation['to']
                
                if from_addr == wallet_address:
                    amount = float(operation['source_amount'])
                    asset = operation['source_asset_type']
                    tx_type = 'path_payment_send'
                else:
                    amount = float(operation['amount'])
                    asset = operation['asset_type']
                    tx_type = 'path_payment_receive'
            else:
                return None
            
            return TransactionData(
                id=operation['id'],
                type=tx_type,
                amount=amount,
                asset=asset if asset != 'native' else 'XLM',
                from_address=from_addr,
                to_address=to_addr,
                timestamp=timestamp,
                successful=operation.get('successful', True),
                memo=operation.get('transaction', {}).get('memo')
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar operação: {str(e)}")
            return None
    
    def _calculate_wallet_metrics(self, transactions: List[TransactionData], address: str) -> WalletMetrics:
        """
        Calcula todas as métricas da carteira
        """
        if not transactions:
            return self._default_metrics()
        
        # Converter para DataFrame para análise
        df = pd.DataFrame([
            {
                'timestamp': tx.timestamp,
                'amount': tx.amount,
                'type': tx.type,
                'asset': tx.asset,
                'successful': tx.successful,
                'is_outgoing': tx.from_address == address
            }
            for tx in transactions
        ])
        
        # 1. Volume total (em USD equivalente)
        total_volume = self._calculate_volume_metrics(df)
        
        # 2. Contagem de transações
        transaction_count = len(df[df['successful'] == True])
        
        # 3. Pontualidade (assumindo que transações bem-sucedidas = pontuais)
        successful_rate = len(df[df['successful'] == True]) / len(df) if len(df) > 0 else 0
        
        # 4. Frequência de uso (transações por mês)
        usage_frequency = self._calculate_usage_frequency(df)
        
        # 5. Score de diversificação
        diversification = self._calculate_diversification_score(df)
        
        # 6. Saldo médio (estimado baseado em padrões)
        avg_balance = self._estimate_average_balance(df, address)
        
        # 7. Score de idade da carteira
        age_score = self._calculate_age_score(df)
        
        # 8. Atividade na rede
        network_activity = self._calculate_network_activity(df)
        
        return WalletMetrics(
            total_volume_3m=total_volume,
            transaction_count_3m=transaction_count,
            avg_balance=avg_balance,
            payment_punctuality=successful_rate,
            usage_frequency=usage_frequency,
            diversification_score=diversification,
            age_score=age_score,
            network_activity=network_activity
        )
    
    def _calculate_volume_metrics(self, df: pd.DataFrame) -> float:
        """
        Calcula volume total em USD equivalente
        """
        # Simplificado: assumir 1 XLM = $0.10, outros assets como stablecoins = $1
        volume = 0
        for _, row in df.iterrows():
            if row['asset'] == 'XLM':
                volume += row['amount'] * 0.10  # Preço simplificado do XLM
            else:
                volume += row['amount']  # Assumir stablecoins
        
        return volume
    
    def _calculate_usage_frequency(self, df: pd.DataFrame) -> float:
        """
        Calcula frequência de uso (transações por mês)
        """
        if len(df) == 0:
            return 0
        
        # Calcular período em meses
        min_date = df['timestamp'].min()
        max_date = df['timestamp'].max()
        period_days = (max_date - min_date).days
        period_months = max(period_days / 30, 1)  # Mínimo 1 mês
        
        return len(df) / period_months
    
    def _calculate_diversification_score(self, df: pd.DataFrame) -> float:
        """
        Calcula score de diversificação baseado em:
        - Variedade de tipos de transação
        - Variedade de assets
        - Variedade de contrapartes
        """
        if len(df) == 0:
            return 0
        
        # Diversificação de tipos
        unique_types = df['type'].nunique()
        type_diversity = min(unique_types / 3, 1)  # Máximo 3 tipos principais
        
        # Diversificação de assets
        unique_assets = df['asset'].nunique()
        asset_diversity = min(unique_assets / 5, 1)  # Máximo 5 assets
        
        # Combinar métricas
        diversification = (type_diversity * 0.6) + (asset_diversity * 0.4)
        
        return diversification
    
    def _estimate_average_balance(self, df: pd.DataFrame, address: str) -> float:
        """
        Estima saldo médio baseado em padrões de transação
        """
        if len(df) == 0:
            return 0
        
        # Calcular fluxo líquido
        inflow = df[~df['is_outgoing']]['amount'].sum()
        outflow = df[df['is_outgoing']]['amount'].sum()
        net_flow = inflow - outflow
        
        # Estimar saldo baseado no volume médio de transações
        avg_transaction = df['amount'].mean()
        estimated_balance = max(avg_transaction * 10, net_flow * 0.1)
        
        return estimated_balance
    
    def _calculate_age_score(self, df: pd.DataFrame) -> float:
        """
        Calcula score baseado na idade/histórico da carteira
        """
        if len(df) == 0:
            return 0
        
        oldest_tx = df['timestamp'].min()
        days_active = (datetime.now() - oldest_tx.replace(tzinfo=None)).days
        
        # Normalizar para 0-1
        if days_active < self.NORMALIZATION_LIMITS['min_age_days']:
            return 0.3  # Penalizar contas muito novas
        
        optimal_days = self.NORMALIZATION_LIMITS['optimal_age_days']
        age_score = min(days_active / optimal_days, 1)
        
        return age_score
    
    def _calculate_network_activity(self, df: pd.DataFrame) -> float:
        """
        Calcula atividade na rede (variedade de contrapartes)
        """
        if len(df) == 0:
            return 0
        
        # Contar endereços únicos interagidos
        # Simplificado: usar ID da transação como proxy
        unique_interactions = df['id'].nunique() if 'id' in df.columns else len(df)
        
        # Normalizar
        max_interactions = 50  # 50 contrapartes diferentes é excelente
        activity_score = min(unique_interactions / max_interactions, 1)
        
        return activity_score
    
    def _calculate_credit_score(self, metrics: WalletMetrics) -> int:
        """
        Calcula score final (0-1000) baseado nas métricas
        """
        # Normalizar métricas para 0-1
        normalized_volume = min(metrics.total_volume_3m / self.NORMALIZATION_LIMITS['max_volume'], 1)
        normalized_frequency = min(metrics.usage_frequency / self.NORMALIZATION_LIMITS['max_frequency'], 1)
        normalized_balance = min(metrics.avg_balance / self.NORMALIZATION_LIMITS['max_balance'], 1)
        
        # Aplicar pesos
        weighted_score = (
            normalized_volume * self.WEIGHTS['volume'] +
            metrics.payment_punctuality * self.WEIGHTS['punctuality'] +
            normalized_frequency * self.WEIGHTS['frequency'] +
            metrics.diversification_score * self.WEIGHTS['diversification'] +
            normalized_balance * self.WEIGHTS['balance']
        )
        
        # Ajustar por idade e atividade na rede
        age_bonus = metrics.age_score * 0.1  # Até 10% de bônus
        network_bonus = metrics.network_activity * 0.05  # Até 5% de bônus
        
        final_score = weighted_score + age_bonus + network_bonus
        
        # Converter para escala 0-1000
        return int(min(final_score * 1000, 1000))
    
    def _determine_loan_terms(self, score: int) -> Tuple[str, float, float]:
        """
        Determina termos de empréstimo baseado no score
        """
        if score >= 750:
            return "LOW", 2000.0, 0.02  # Até $2k, 2% ao mês
        elif score >= 600:
            return "LOW", 1000.0, 0.025  # Até $1k, 2.5% ao mês
        elif score >= 450:
            return "MEDIUM", 500.0, 0.04  # Até $500, 4% ao mês
        elif score >= 300:
            return "MEDIUM", 200.0, 0.06  # Até $200, 6% ao mês
        else:
            return "HIGH", 0.0, 0.10  # Não elegível
    
    def _generate_recommendations(self, metrics: WalletMetrics, score: int) -> List[str]:
        """
        Gera recomendações para melhorar o score
        """
        recommendations = []
        
        if metrics.usage_frequency < 5:
            recommendations.append("Aumente a frequência de transações para melhorar seu score")
        
        if metrics.diversification_score < 0.5:
            recommendations.append("Diversifique seus tipos de transação e assets utilizados")
        
        if metrics.payment_punctuality < 0.9:
            recommendations.append("Mantenha alta taxa de sucesso em suas transações")
        
        if metrics.avg_balance < 100:
            recommendations.append("Mantenha um saldo médio mais alto para demonstrar estabilidade")
        
        if score < 300:
            recommendations.append("Continue usando a rede Stellar para construir seu histórico")
        
        if not recommendations:
            recommendations.append("Excelente perfil! Continue mantendo seus bons hábitos financeiros")
        
        return recommendations
    
    def _create_new_user_score(self) -> CreditScore:
        """
        Cria score padrão para usuários novos
        """
        return CreditScore(
            score=250,  # Score inicial baixo
            metrics=self._default_metrics(),
            risk_level="HIGH",
            max_loan_amount=0.0,
            interest_rate=0.10,
            recommendations=[
                "Comece realizando transações na rede Stellar",
                "Mantenha consistência em suas operações",
                "Diversifique os tipos de transações realizadas"
            ]
        )
    
    def _default_metrics(self) -> WalletMetrics:
        """
        Métricas padrão para carteiras sem histórico
        """
        return WalletMetrics(
            total_volume_3m=0.0,
            transaction_count_3m=0,
            avg_balance=0.0,
            payment_punctuality=0.0,
            usage_frequency=0.0,
            diversification_score=0.0,
            age_score=0.0,
            network_activity=0.0
        )

# Funções utilitárias para API
def create_mock_transaction_data() -> List[TransactionData]:
    """
    Cria dados de transação mockados para desenvolvimento/demo
    """
    base_time = datetime.now() - timedelta(days=30)
    
    mock_transactions = [
        TransactionData(
            id=f"tx_{i}",
            type="payment" if i % 2 == 0 else "receive",
            amount=100 + (i * 50),
            asset="USDC" if i % 3 == 0 else "XLM",
            from_address="GTEST1..." if i % 2 == 0 else "GTEST2...",
            to_address="GTEST2..." if i % 2 == 0 else "GTEST1...",
            timestamp=base_time + timedelta(days=i),
            successful=True,
            memo=f"Payment {i}"
        )
        for i in range(20)
    ]
    
    return mock_transactions

# Exemplo de uso
if __name__ == "__main__":
    import asyncio
    
    async def main():
        # Inicializar sistema
        ai = StellarCreditAI("testnet")
        
        # Exemplo de endereço (substitua por um real)
        test_address = "GCKFBEIYTKP33XJZJ5XPT2YDMX3QZYLZSYX6ON6BPUZN5XGMB36HPQLM"
        
        # Análise
        score = await ai.analyze_wallet(test_address)
        
        # Resultados
        print(f"Score de Crédito: {score.score}")
        print(f"Nível de Risco: {score.risk_level}")
        print(f"Empréstimo Máximo: ${score.max_loan_amount}")
        print(f"Taxa de Juros: {score.interest_rate:.1%} ao mês")
        print("\nRecomendações:")
        for rec in score.recommendations:
            print(f"- {rec}")
    
    # Executar exemplo
    # asyncio.run(main())
