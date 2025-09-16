/**
 * Logger configurado para Stellar Credit
 * Sistema de logging centralizado com diferentes níveis
 */

const winston = require('winston');
const path = require('path');

// Definir níveis de log customizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Cores para cada nível
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adicionar cores ao winston
winston.addColors(logColors);

// Formato customizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Formato para arquivos (sem cores)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir transports baseados no ambiente
const transports = [
  // Console transport (sempre ativo)
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat
  }),
];

// Adicionar file transports em produção
if (process.env.NODE_ENV === 'production') {
  // Log de erros
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Adicionar método para log de transações Stellar
logger.stellar = (action, details) => {
  logger.info(`STELLAR [${action}]: ${JSON.stringify(details)}`);
};

// Adicionar método para log de contratos
logger.contract = (action, details) => {
  logger.info(`CONTRACT [${action}]: ${JSON.stringify(details)}`);
};

// Adicionar método para log de IA
logger.ai = (action, details) => {
  logger.info(`AI [${action}]: ${JSON.stringify(details)}`);
};

// Adicionar método para log de API
logger.api = (method, endpoint, status, duration) => {
  logger.http(`API [${method}] ${endpoint} - ${status} (${duration}ms)`);
};

// Capturar exceções não tratadas
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: fileFormat
    })
  );

  logger.rejections.handle(
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: fileFormat
    })
  );
}

module.exports = logger;
