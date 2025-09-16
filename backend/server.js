/**
 * Stellar Credit Backend Server
 * API REST para integração com smart contracts Soroban e sistema de IA
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar módulos do projeto
const logger = require('./utils/logger');
const stellarService = require('./services/stellarService');
const contractService = require('./services/contractService');
const aiService = require('./services/aiService');
const websocketService = require('./services/websocketService');
const authMiddleware = require('./middleware/auth');
const validationMiddleware = require('./middleware/validation');

// Configurações
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Inicializar Express
const app = express();

// === MIDDLEWARES ===

// Segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: 900
  }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Compressão
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === ROUTES ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Stellar Credit Backend API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health'
  });
});

// === API ROUTES ===

// Análise de carteira e score
app.post('/api/analyze-wallet', 
  validationMiddleware.validateWalletAddress,
  async (req, res) => {
    try {
      const { address, network = 'testnet' } = req.body;
      
      logger.info(`Iniciando análise da carteira: ${address}`);
      
      // 1. Validar endereço Stellar
      if (!stellarService.isValidStellarAddress(address)) {
        return res.status(400).json({
          error: 'Endereço Stellar inválido',
          code: 'INVALID_ADDRESS'
        });
      }
      
      // 2. Buscar dados da carteira
      const walletData = await stellarService.getWalletData(address, network);
      
      // 3. Calcular score via IA
      const scoreAnalysis = await aiService.calculateScore(address, walletData);
      
      // 4. Armazenar score no smart contract
      const contractResult = await contractService.storeScore(
        address,
        scoreAnalysis.score,
        scoreAnalysis.metrics
      );
      
      // 5. Buscar ofertas de empréstimo
      const loanOffers = await contractService.getLoanOffers(scoreAnalysis.score);
      
      const response = {
        address,
        score: scoreAnalysis.score,
        risk_level: scoreAnalysis.risk_level,
        metrics: scoreAnalysis.metrics,
        loan_offers: loanOffers,
        recommendations: scoreAnalysis.recommendations,
        contract_transaction: contractResult.transactionHash,
        analysis_timestamp: new Date().toISOString()
      };
      
      logger.info(`Análise concluída para ${address}. Score: ${scoreAnalysis.score}`);
      res.json(response);
      
    } catch (error) {
      logger.error(`Erro na análise da carteira: ${error.message}`, error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message,
        code: 'ANALYSIS_ERROR'
      });
    }
  }
);

// Buscar score existente
app.get('/api/score/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!stellarService.isValidStellarAddress(address)) {
      return res.status(400).json({
        error: 'Endereço Stellar inválido',
        code: 'INVALID_ADDRESS'
      });
    }
    
    const scoreData = await contractService.getScore(address);
    
    if (!scoreData) {
      return res.status(404).json({
        error: 'Score não encontrado para este endereço',
        code: 'SCORE_NOT_FOUND'
      });
    }
    
    res.json(scoreData);
    
  } catch (error) {
    logger.error(`Erro ao buscar score: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SCORE_FETCH_ERROR'
    });
  }
});

// Solicitar empréstimo
app.post('/api/request-loan',
  validationMiddleware.validateLoanRequest,
  async (req, res) => {
    try {
      const { address, amount, duration_months } = req.body;
      
      logger.info(`Solicitação de empréstimo: ${address} - $${amount}`);
      
      // 1. Verificar se usuário tem score
      const scoreData = await contractService.getScore(address);
      if (!scoreData) {
        return res.status(400).json({
          error: 'É necessário ter um score de crédito para solicitar empréstimo',
          code: 'NO_SCORE'
        });
      }
      
      // 2. Solicitar empréstimo via contrato
      const loanResult = await contractService.requestLoan(
        address,
        amount,
        duration_months
      );
      
      res.json({
        loan_id: loanResult.loanId,
        status: loanResult.status,
        amount: amount,
        interest_rate: loanResult.interestRate,
        duration_months: duration_months,
        transaction_hash: loanResult.transactionHash,
        created_at: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`Erro na solicitação de empréstimo: ${error.message}`, error);
      
      if (error.message.includes('EXCEEDED')) {
        return res.status(400).json({
          error: 'Valor solicitado excede o limite para seu score',
          code: 'AMOUNT_EXCEEDED'
        });
      }
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'LOAN_REQUEST_ERROR'
      });
    }
  }
);

// Buscar empréstimo
app.get('/api/loan/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const loanData = await contractService.getLoan(parseInt(loanId));
    
    if (!loanData) {
      return res.status(404).json({
        error: 'Empréstimo não encontrado',
        code: 'LOAN_NOT_FOUND'
      });
    }
    
    res.json(loanData);
    
  } catch (error) {
    logger.error(`Erro ao buscar empréstimo: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'LOAN_FETCH_ERROR'
    });
  }
});

// Ofertas de empréstimo baseadas no score
app.get('/api/loan-offers/:score', async (req, res) => {
  try {
    const score = parseInt(req.params.score);
    
    if (isNaN(score) || score < 0 || score > 1000) {
      return res.status(400).json({
        error: 'Score deve ser um número entre 0 e 1000',
        code: 'INVALID_SCORE'
      });
    }
    
    const offers = await contractService.getLoanOffers(score);
    res.json(offers);
    
  } catch (error) {
    logger.error(`Erro ao buscar ofertas: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'OFFERS_FETCH_ERROR'
    });
  }
});

// Histórico de transações
app.get('/api/transaction-history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, cursor } = req.query;
    
    if (!stellarService.isValidStellarAddress(address)) {
      return res.status(400).json({
        error: 'Endereço Stellar inválido',
        code: 'INVALID_ADDRESS'
      });
    }
    
    const transactions = await stellarService.getTransactionHistory(
      address,
      parseInt(limit),
      cursor
    );
    
    res.json(transactions);
    
  } catch (error) {
    logger.error(`Erro ao buscar histórico: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'HISTORY_FETCH_ERROR'
    });
  }
});

// Estatísticas da rede
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await contractService.getNetworkStats();
    res.json(stats);
  } catch (error) {
    logger.error(`Erro ao buscar estatísticas: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

// === ENDPOINTS PARA DEMO ===

// Dados mockados para demonstração
app.get('/api/demo/user/:profile', async (req, res) => {
  try {
    const { profile } = req.params;
    
    const demoUsers = {
      good_payer: {
        address: 'GCKFBEIYTKP33XJZJ5XPT2YDMX3QZYLZSYX6ON6BPUZN5XGMB36HPQLM',
        score: 750,
        risk_level: 'LOW',
        metrics: {
          total_volume_3m: 15000,
          transaction_count_3m: 47,
          avg_balance: 850,
          payment_punctuality: 0.95,
          usage_frequency: 15.7,
          diversification_score: 0.8
        }
      },
      medium_payer: {
        address: 'GDRT5YOB6FGVKJRHFZ56DPH5H2XTQB7A3XTX4EQTKQR3QH3NO2JLQKLM',
        score: 450,
        risk_level: 'MEDIUM',
        metrics: {
          total_volume_3m: 3000,
          transaction_count_3m: 20,
          avg_balance: 150,
          payment_punctuality: 0.7,
          usage_frequency: 6.7,
          diversification_score: 0.4
        }
      },
      new_user: {
        address: 'GCUS5TGL6QFBQC6UKZGHFQEXL4XVT7ZTN5QQ5DKFQGXLRMN7L3YQABC',
        score: 300,
        risk_level: 'HIGH',
        metrics: {
          total_volume_3m: 500,
          transaction_count_3m: 5,
          avg_balance: 50,
          payment_punctuality: 1.0,
          usage_frequency: 1.7,
          diversification_score: 0.2
        }
      }
    };
    
    const userData = demoUsers[profile];
    if (!userData) {
      return res.status(404).json({
        error: 'Perfil de demo não encontrado',
        code: 'DEMO_PROFILE_NOT_FOUND'
      });
    }
    
    res.json({
      ...userData,
      demo: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Erro no endpoint demo: ${error.message}`, error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'DEMO_ERROR'
    });
  }
});

// === ERROR HANDLING ===

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    method: req.method,
    url: req.originalUrl
  });
});

// Error handler global
app.use((err, req, res, next) => {
  logger.error(`Erro não tratado: ${err.message}`, err);
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// === WEBSOCKET EVENTS ===

function setupWebSocketEvents() {
  // Escutar eventos de conexão de carteira
  websocketService.on('wallet_connected', async (data) => {
    const { clientId, address, walletType, network } = data;
    
    try {
      logger.info(`Iniciando análise automática para carteira conectada: ${address}`);
      
      // Buscar dados da carteira em background
      setTimeout(async () => {
        try {
          const walletData = await stellarService.getWalletData(address, network);
          
          // Enviar dados da carteira
          websocketService.sendToClient(clientId, {
            type: 'wallet_data_ready',
            address,
            data: walletData,
            timestamp: new Date().toISOString()
          });
          
          // Calcular score se há dados suficientes
          if (walletData.exists && walletData.transactions.records.length > 0) {
            const scoreAnalysis = await aiService.calculateScore(address, walletData);
            
            // Enviar score calculado
            websocketService.sendToClient(clientId, {
              type: 'score_calculated',
              address,
              score: scoreAnalysis.score,
              risk_level: scoreAnalysis.risk_level,
              metrics: scoreAnalysis.metrics,
              recommendations: scoreAnalysis.recommendations,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          logger.error(`Erro na análise automática: ${error.message}`);
          websocketService.sendToClient(clientId, {
            type: 'analysis_error',
            address,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }, 1000); // 1 segundo de delay para não sobrecarregar
      
    } catch (error) {
      logger.error(`Erro ao processar conexão de carteira: ${error.message}`);
    }
  });

  // Escutar eventos de inscrição para atualizações
  websocketService.on('subscribe_updates', async (data) => {
    const { clientId, address, updateTypes } = data;
    
    // Iniciar monitoramento de transações em tempo real se solicitado
    if (updateTypes.includes('transactions') || updateTypes.includes('balance')) {
      try {
        const eventSource = stellarService.watchPayments(address, (payment) => {
          // Notificar cliente sobre nova transação
          websocketService.sendToClient(clientId, {
            type: 'new_transaction',
            address,
            transaction: payment,
            timestamp: new Date().toISOString()
          });
          
          // Se monitorando balance, buscar saldo atualizado
          if (updateTypes.includes('balance')) {
            setTimeout(async () => {
              try {
                const updatedData = await stellarService.getWalletData(address);
                websocketService.sendToClient(clientId, {
                  type: 'balance_updated',
                  address,
                  balances: updatedData.balances,
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                logger.error(`Erro ao atualizar saldo: ${error.message}`);
              }
            }, 2000); // 2 segundos para atualização se propagar
          }
        });
        
        // Armazenar referência do eventSource para cleanup posterior
        // TODO: Implementar cleanup quando cliente desconectar
        
      } catch (error) {
        logger.error(`Erro ao iniciar monitoramento: ${error.message}`);
      }
    }
  });
}

// Endpoint para estatísticas WebSocket
app.get('/api/ws/stats', (req, res) => {
  try {
    const stats = websocketService.getStats();
    res.json({
      websocket: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Erro ao buscar estatísticas WebSocket: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'WS_STATS_ERROR'
    });
  }
});

// === STARTUP ===

async function startServer() {
  try {
    // Inicializar serviços
    await stellarService.initialize();
    await contractService.initialize();
    await aiService.initialize();
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Stellar Credit Backend rodando na porta ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info(`📖 API docs: http://localhost:${PORT}/api/docs`);
    });
    
    // Inicializar WebSocket
    websocketService.initialize(server);
    
    // Configurar eventos do WebSocket
    setupWebSocketEvents();
    
    logger.info(`🔌 WebSocket Server ativo em ws://localhost:${PORT}/ws`);
    
  } catch (error) {
    logger.error(`Erro na inicialização do servidor: ${error.message}`, error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Fazendo shutdown graceful...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Fazendo shutdown graceful...');
  process.exit(0);
});

// Iniciar servidor
if (require.main === module) {
  startServer();
}

module.exports = app;
