/**
 * Middleware de Autenticação
 * Sistema de autenticação JWT e validação de sessões
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'stellar_credit_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Gera token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'stellar-credit',
    audience: 'stellar-credit-api'
  });
};

/**
 * Verifica token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'stellar-credit',
      audience: 'stellar-credit-api'
    });
  } catch (error) {
    throw new Error(`Token inválido: ${error.message}`);
  }
};

/**
 * Middleware de autenticação JWT
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    
    logger.info(`Usuário autenticado: ${decoded.address || decoded.id}`);
    next();

  } catch (error) {
    logger.warn(`Falha na autenticação: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      error: 'Falha na autenticação',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware de autenticação opcional
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
        logger.info(`Usuário autenticado opcionalmente: ${decoded.address || decoded.id}`);
      } catch (error) {
        logger.warn(`Token opcional inválido: ${error.message}`);
        // Continue sem autenticação
      }
    }

    next();

  } catch (error) {
    logger.error(`Erro na autenticação opcional: ${error.message}`);
    next(); // Continue mesmo com erro
  }
};

/**
 * Middleware para verificar se usuário é admin
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Acesso restrito a administradores',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();

  } catch (error) {
    logger.error(`Erro na verificação de admin: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de autorização',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para verificar rate limiting por usuário
 */
const userRateLimit = (maxRequests = 60, windowMinutes = 15) => {
  const userRequests = new Map();

  return (req, res, next) => {
    try {
      const userId = req.user?.address || req.ip;
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      if (!userRequests.has(userId)) {
        userRequests.set(userId, []);
      }

      const requests = userRequests.get(userId);
      
      // Remover requests antigos
      const validRequests = requests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Muitas requisições. Tente novamente mais tarde.',
          code: 'USER_RATE_LIMIT',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      validRequests.push(now);
      userRequests.set(userId, validRequests);

      next();

    } catch (error) {
      logger.error(`Erro no rate limiting: ${error.message}`);
      next(); // Continue mesmo com erro
    }
  };
};

/**
 * Cria sessão para carteira Stellar
 */
const createWalletSession = (stellarAddress, additionalData = {}) => {
  const payload = {
    address: stellarAddress,
    type: 'wallet',
    isAdmin: stellarAddress === process.env.ADMIN_PUBLIC_KEY,
    ...additionalData,
    iat: Math.floor(Date.now() / 1000)
  };

  return generateToken(payload);
};

/**
 * Middleware para validar assinatura Stellar (futuro)
 */
const validateStellarSignature = (req, res, next) => {
  // Placeholder para validação de assinatura Stellar
  // Será implementado quando integrarmos com Passkeys
  
  try {
    const { signature, message, publicKey } = req.body;

    if (!signature || !message || !publicKey) {
      return res.status(400).json({
        error: 'Assinatura, mensagem e chave pública são obrigatórios',
        code: 'MISSING_SIGNATURE_DATA'
      });
    }

    // TODO: Implementar validação real da assinatura
    // Por enquanto, apenas validar formato da chave pública
    const { Keypair } = require('@stellar/stellar-sdk');
    try {
      Keypair.fromPublicKey(publicKey);
    } catch (error) {
      return res.status(400).json({
        error: 'Chave pública Stellar inválida',
        code: 'INVALID_PUBLIC_KEY'
      });
    }

    req.stellarAuth = {
      publicKey,
      message,
      signature,
      verified: true // TODO: resultado da verificação real
    };

    next();

  } catch (error) {
    logger.error(`Erro na validação de assinatura: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno na validação de assinatura',
      code: 'SIGNATURE_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware para log de atividades de usuário
 */
const logUserActivity = (action) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = req.user?.address || 'anonymous';
      
      logger.info(`USER_ACTIVITY [${action}] ${userId} - ${res.statusCode} (${duration}ms)`);
    });

    next();
  };
};

/**
 * Middleware para CORS específico de autenticação
 */
const authCors = (req, res, next) => {
  // Headers específicos para autenticação
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return res.status(200).end();
  }
  
  next();
};

/**
 * Utilitário para hash de senhas
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Utilitário para verificar senhas
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  userRateLimit,
  createWalletSession,
  validateStellarSignature,
  logUserActivity,
  authCors,
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword
};
