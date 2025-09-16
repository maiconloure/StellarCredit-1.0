/**
 * Middleware de Validação
 * Validações de entrada para endpoints da API
 */

const Joi = require('joi');
const { Keypair } = require('@stellar/stellar-sdk');
const logger = require('../utils/logger');

// Schema para validação de endereço Stellar
const stellarAddressSchema = Joi.string()
  .length(56)
  .pattern(/^G[0-9A-Z]{55}$/)
  .required()
  .messages({
    'string.length': 'Endereço Stellar deve ter 56 caracteres',
    'string.pattern.base': 'Endereço Stellar deve começar com G e conter apenas caracteres válidos',
    'any.required': 'Endereço Stellar é obrigatório'
  });

// Schema para validação de rede
const networkSchema = Joi.string()
  .valid('testnet', 'mainnet')
  .default('testnet')
  .messages({
    'any.only': 'Rede deve ser testnet ou mainnet'
  });

// Schema para validação de análise de carteira
const walletAnalysisSchema = Joi.object({
  address: stellarAddressSchema,
  network: networkSchema
});

// Schema para validação de solicitação de empréstimo
const loanRequestSchema = Joi.object({
  address: stellarAddressSchema,
  amount: Joi.number()
    .positive()
    .max(10000)
    .required()
    .messages({
      'number.positive': 'Valor do empréstimo deve ser positivo',
      'number.max': 'Valor máximo do empréstimo é $10,000',
      'any.required': 'Valor do empréstimo é obrigatório'
    }),
  duration_months: Joi.number()
    .integer()
    .min(1)
    .max(60)
    .required()
    .messages({
      'number.integer': 'Duração deve ser um número inteiro',
      'number.min': 'Duração mínima é 1 mês',
      'number.max': 'Duração máxima é 60 meses',
      'any.required': 'Duração é obrigatória'
    })
});

// Schema para validação de paginação
const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(200)
    .default(50)
    .messages({
      'number.integer': 'Limite deve ser um número inteiro',
      'number.min': 'Limite mínimo é 1',
      'number.max': 'Limite máximo é 200'
    }),
  cursor: Joi.string()
    .optional()
    .allow('')
    .messages({
      'string.base': 'Cursor deve ser uma string'
    })
});

/**
 * Middleware para validar endereço Stellar
 */
const validateWalletAddress = (req, res, next) => {
  try {
    const { error, value } = walletAnalysisSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Dados de entrada inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'VALIDATION_ERROR'
      });
    }

    // Validação adicional do endereço Stellar usando SDK
    try {
      Keypair.fromPublicKey(value.address);
    } catch (stellarError) {
      return res.status(400).json({
        error: 'Endereço Stellar inválido',
        message: 'Endereço não passou na validação do SDK Stellar',
        code: 'INVALID_STELLAR_ADDRESS'
      });
    }

    req.validatedData = value;
    next();

  } catch (error) {
    logger.error(`Erro na validação de endereço: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para validar solicitação de empréstimo
 */
const validateLoanRequest = (req, res, next) => {
  try {
    const { error, value } = loanRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Dados de solicitação inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'LOAN_VALIDATION_ERROR'
      });
    }

    // Validação adicional do endereço
    try {
      Keypair.fromPublicKey(value.address);
    } catch (stellarError) {
      return res.status(400).json({
        error: 'Endereço Stellar inválido',
        code: 'INVALID_STELLAR_ADDRESS'
      });
    }

    // Validações de negócio específicas
    if (value.amount < 50) {
      return res.status(400).json({
        error: 'Valor mínimo de empréstimo é $50',
        code: 'AMOUNT_TOO_LOW'
      });
    }

    req.validatedData = value;
    next();

  } catch (error) {
    logger.error(`Erro na validação de empréstimo: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para validar parâmetros de paginação
 */
const validatePagination = (req, res, next) => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Parâmetros de paginação inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        code: 'PAGINATION_ERROR'
      });
    }

    req.pagination = value;
    next();

  } catch (error) {
    logger.error(`Erro na validação de paginação: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para validar score
 */
const validateScore = (req, res, next) => {
  try {
    const score = parseInt(req.params.score);
    
    if (isNaN(score) || score < 0 || score > 1000) {
      return res.status(400).json({
        error: 'Score deve ser um número entre 0 e 1000',
        code: 'INVALID_SCORE'
      });
    }

    req.score = score;
    next();

  } catch (error) {
    logger.error(`Erro na validação de score: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para validar ID de empréstimo
 */
const validateLoanId = (req, res, next) => {
  try {
    const loanId = parseInt(req.params.loanId);
    
    if (isNaN(loanId) || loanId < 1) {
      return res.status(400).json({
        error: 'ID de empréstimo deve ser um número positivo',
        code: 'INVALID_LOAN_ID'
      });
    }

    req.loanId = loanId;
    next();

  } catch (error) {
    logger.error(`Erro na validação de loan ID: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para sanitizar entrada
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizar strings para prevenir XSS
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };

    // Sanitizar recursivamente
    const sanitizeObject = (obj) => {
      if (obj === null || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = typeof obj[key] === 'string' ? 
            sanitizeString(obj[key]) : 
            sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();

  } catch (error) {
    logger.error(`Erro na sanitização: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'SANITIZATION_ERROR'
    });
  }
};

/**
 * Middleware para validar perfil demo
 */
const validateDemoProfile = (req, res, next) => {
  try {
    const { profile } = req.params;
    const validProfiles = ['good_payer', 'medium_payer', 'new_user'];
    
    if (!validProfiles.includes(profile)) {
      return res.status(400).json({
        error: 'Perfil demo inválido',
        message: `Perfis válidos: ${validProfiles.join(', ')}`,
        code: 'INVALID_DEMO_PROFILE'
      });
    }

    req.demoProfile = profile;
    next();

  } catch (error) {
    logger.error(`Erro na validação de perfil demo: ${error.message}`);
    res.status(500).json({
      error: 'Erro interno de validação',
      code: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

module.exports = {
  validateWalletAddress,
  validateLoanRequest,
  validatePagination,
  validateScore,
  validateLoanId,
  sanitizeInput,
  validateDemoProfile,
  
  // Esquemas para uso direto
  schemas: {
    stellarAddress: stellarAddressSchema,
    network: networkSchema,
    walletAnalysis: walletAnalysisSchema,
    loanRequest: loanRequestSchema,
    pagination: paginationSchema
  }
};
