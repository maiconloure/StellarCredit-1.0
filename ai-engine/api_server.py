"""
API Server para o Sistema de IA de Crédito Stellar
FastAPI server que expõe endpoints para análise de crédito
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uvicorn
import asyncio
import json
from datetime import datetime
import logging

from stellar_ai_scoring import StellarCreditAI, CreditScore, WalletMetrics

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Stellar Credit AI API",
    description="API para análise de crédito baseada em transações Stellar",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic para API
class WalletAnalysisRequest(BaseModel):
    address: str = Field(..., description="Endereço da carteira Stellar")
    network: str = Field(default="testnet", description="Rede Stellar (testnet/mainnet)")

class WalletMetricsResponse(BaseModel):
    total_volume_3m: float
    transaction_count_3m: int
    avg_balance: float
    payment_punctuality: float
    usage_frequency: float
    diversification_score: float
    age_score: float
    network_activity: float

class CreditScoreResponse(BaseModel):
    score: int
    metrics: WalletMetricsResponse
    risk_level: str
    max_loan_amount: float
    interest_rate: float
    recommendations: List[str]
    analysis_timestamp: datetime

class LoanOfferRequest(BaseModel):
    score: int = Field(..., ge=0, le=1000, description="Score de crédito (0-1000)")

class LoanOffer(BaseModel):
    amount: float
    interest_rate: float
    duration_months: int
    description: str

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    network: str

# Instância global do sistema de IA
ai_system = None

@app.on_event("startup")
async def startup_event():
    """Inicializa o sistema de IA na inicialização do servidor"""
    global ai_system
    ai_system = StellarCreditAI("testnet")
    logger.info("Stellar Credit AI API inicializada")

# === ENDPOINTS PRINCIPAIS ===

@app.get("/", response_model=Dict[str, str])
async def root():
    """Endpoint raiz com informações da API"""
    return {
        "message": "Stellar Credit AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        network="testnet"
    )

@app.post("/analyze-wallet", response_model=CreditScoreResponse)
async def analyze_wallet(request: WalletAnalysisRequest):
    """
    Analisa uma carteira Stellar e retorna o score de crédito
    
    Args:
        request: Dados da requisição com endereço e rede
        
    Returns:
        CreditScoreResponse: Score e métricas detalhadas
    """
    try:
        logger.info(f"Analisando carteira: {request.address}")
        
        # Usar rede especificada ou padrão
        if request.network != ai_system.network:
            temp_ai = StellarCreditAI(request.network)
            score_result = await temp_ai.analyze_wallet(request.address)
        else:
            score_result = await ai_system.analyze_wallet(request.address)
        
        # Converter para response model
        response = CreditScoreResponse(
            score=score_result.score,
            metrics=WalletMetricsResponse(**score_result.metrics.__dict__),
            risk_level=score_result.risk_level,
            max_loan_amount=score_result.max_loan_amount,
            interest_rate=score_result.interest_rate,
            recommendations=score_result.recommendations,
            analysis_timestamp=datetime.now()
        )
        
        logger.info(f"Análise concluída. Score: {score_result.score}")
        return response
        
    except Exception as e:
        logger.error(f"Erro na análise da carteira: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.get("/loan-offers/{score}", response_model=List[LoanOffer])
async def get_loan_offers(score: int):
    """
    Retorna ofertas de empréstimo baseadas no score
    
    Args:
        score: Score de crédito (0-1000)
        
    Returns:
        List[LoanOffer]: Lista de ofertas disponíveis
    """
    try:
        if score < 0 or score > 1000:
            raise HTTPException(status_code=400, detail="Score deve estar entre 0 e 1000")
        
        offers = []
        
        if score >= 750:
            offers = [
                LoanOffer(
                    amount=2000.0,
                    interest_rate=0.02,
                    duration_months=12,
                    description="Empréstimo Premium - Taxa baixa para excelente histórico"
                ),
                LoanOffer(
                    amount=1000.0,
                    interest_rate=0.015,
                    duration_months=6,
                    description="Empréstimo Rápido - Curto prazo com taxa especial"
                )
            ]
        elif score >= 600:
            offers = [
                LoanOffer(
                    amount=1000.0,
                    interest_rate=0.025,
                    duration_months=12,
                    description="Empréstimo Padrão - Boas condições"
                ),
                LoanOffer(
                    amount=500.0,
                    interest_rate=0.02,
                    duration_months=6,
                    description="Empréstimo Rápido - Valor menor, taxa melhor"
                )
            ]
        elif score >= 450:
            offers = [
                LoanOffer(
                    amount=500.0,
                    interest_rate=0.04,
                    duration_months=12,
                    description="Empréstimo Intermediário"
                ),
                LoanOffer(
                    amount=200.0,
                    interest_rate=0.035,
                    duration_months=6,
                    description="Empréstimo Básico - Construa seu histórico"
                )
            ]
        elif score >= 300:
            offers = [
                LoanOffer(
                    amount=200.0,
                    interest_rate=0.06,
                    duration_months=6,
                    description="Empréstimo Inicial - Para construir histórico"
                ),
                LoanOffer(
                    amount=100.0,
                    interest_rate=0.05,
                    duration_months=3,
                    description="Microcrédito - Primeiro empréstimo"
                )
            ]
        else:
            # Score muito baixo - sem ofertas
            offers = []
        
        logger.info(f"Retornando {len(offers)} ofertas para score {score}")
        return offers
        
    except Exception as e:
        logger.error(f"Erro ao buscar ofertas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar ofertas: {str(e)}")

@app.get("/mock-analysis/{profile}", response_model=CreditScoreResponse)
async def get_mock_analysis(profile: str):
    """
    Retorna análise mockada para demonstração
    
    Args:
        profile: Tipo de perfil (good_payer, medium_payer, new_user)
        
    Returns:
        CreditScoreResponse: Análise mockada
    """
    try:
        mock_profiles = {
            "good_payer": {
                "score": 750,
                "metrics": WalletMetricsResponse(
                    total_volume_3m=15000.0,
                    transaction_count_3m=47,
                    avg_balance=850.0,
                    payment_punctuality=0.95,
                    usage_frequency=15.7,
                    diversification_score=0.8,
                    age_score=0.9,
                    network_activity=0.7
                ),
                "risk_level": "LOW",
                "max_loan_amount": 2000.0,
                "interest_rate": 0.02,
                "recommendations": [
                    "Excelente perfil! Continue mantendo seus bons hábitos",
                    "Considere diversificar ainda mais seus assets"
                ]
            },
            "medium_payer": {
                "score": 450,
                "metrics": WalletMetricsResponse(
                    total_volume_3m=3000.0,
                    transaction_count_3m=20,
                    avg_balance=150.0,
                    payment_punctuality=0.7,
                    usage_frequency=6.7,
                    diversification_score=0.4,
                    age_score=0.6,
                    network_activity=0.3
                ),
                "risk_level": "MEDIUM",
                "max_loan_amount": 500.0,
                "interest_rate": 0.04,
                "recommendations": [
                    "Aumente a frequência de transações",
                    "Melhore a pontualidade dos pagamentos",
                    "Diversifique os tipos de transação"
                ]
            },
            "new_user": {
                "score": 300,
                "metrics": WalletMetricsResponse(
                    total_volume_3m=500.0,
                    transaction_count_3m=5,
                    avg_balance=50.0,
                    payment_punctuality=1.0,
                    usage_frequency=1.7,
                    diversification_score=0.2,
                    age_score=0.3,
                    network_activity=0.1
                ),
                "risk_level": "HIGH",
                "max_loan_amount": 200.0,
                "interest_rate": 0.06,
                "recommendations": [
                    "Continue usando a rede Stellar para construir histórico",
                    "Realize mais transações variadas",
                    "Mantenha alta taxa de sucesso"
                ]
            }
        }
        
        if profile not in mock_profiles:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")
        
        profile_data = mock_profiles[profile]
        
        response = CreditScoreResponse(
            score=profile_data["score"],
            metrics=profile_data["metrics"],
            risk_level=profile_data["risk_level"],
            max_loan_amount=profile_data["max_loan_amount"],
            interest_rate=profile_data["interest_rate"],
            recommendations=profile_data["recommendations"],
            analysis_timestamp=datetime.now()
        )
        
        logger.info(f"Retornando análise mockada para perfil: {profile}")
        return response
        
    except Exception as e:
        logger.error(f"Erro ao buscar perfil mockado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

@app.get("/transaction-history/{address}")
async def get_transaction_history(address: str, limit: int = 50):
    """
    Retorna histórico de transações de uma carteira
    
    Args:
        address: Endereço da carteira
        limit: Limite de transações (máximo 200)
        
    Returns:
        Dict: Histórico de transações
    """
    try:
        if limit > 200:
            limit = 200
        
        # Para demo, retornar dados mockados
        mock_transactions = [
            {
                "id": f"tx_{i:03d}",
                "type": "payment" if i % 2 == 0 else "receive",
                "amount": 100 + (i * 25),
                "asset": "USDC" if i % 3 == 0 else "XLM",
                "timestamp": (datetime.now() - datetime.fromtimestamp(i * 86400)).isoformat(),
                "status": "success",
                "memo": f"Transaction {i}"
            }
            for i in range(min(limit, 30))
        ]
        
        return {
            "address": address,
            "transactions": mock_transactions,
            "total_count": len(mock_transactions),
            "analysis_available": True
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

# === ENDPOINTS UTILITÁRIOS ===

@app.get("/score-distribution")
async def get_score_distribution():
    """Retorna distribuição de scores para análise"""
    return {
        "score_ranges": [
            {"range": "750-1000", "percentage": 15, "risk": "LOW", "description": "Excelente"},
            {"range": "600-749", "percentage": 25, "risk": "LOW", "description": "Bom"},
            {"range": "450-599", "percentage": 30, "risk": "MEDIUM", "description": "Regular"},
            {"range": "300-449", "percentage": 20, "risk": "MEDIUM", "description": "Baixo"},
            {"range": "0-299", "percentage": 10, "risk": "HIGH", "description": "Muito Baixo"}
        ],
        "average_score": 520,
        "median_score": 485
    }

@app.get("/network-stats")
async def get_network_stats():
    """Retorna estatísticas da rede para contexto"""
    return {
        "total_analyzed_wallets": 1547,
        "avg_score": 520,
        "active_users_3m": 892,
        "total_volume_analyzed": 12500000.0,
        "network": ai_system.network if ai_system else "testnet"
    }

# Função para executar o servidor
def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """
    Executa o servidor FastAPI
    
    Args:
        host: Host para bind
        port: Porta do servidor
        reload: Auto-reload para desenvolvimento
    """
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    # Executar servidor em modo desenvolvimento
    run_server(host="localhost", port=8001, reload=True)
