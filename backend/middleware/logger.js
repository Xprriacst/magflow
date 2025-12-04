/**
 * Middleware de logging centralisé
 * Logs structurés pour faciliter le debugging et le monitoring
 */

/**
 * Logger avec niveaux et timestamps
 */
export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...meta
    }));
  },

  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      ...meta
    }));
  },

  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...meta
    }));
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...meta
      }));
    }
  }
};

/**
 * Middleware pour logger toutes les requêtes HTTP
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log de la requête entrante
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Intercepter la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    logger[logLevel]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
};

/**
 * Middleware pour logger les erreurs
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });

  next(err);
};

/**
 * Logger pour les services externes
 */
export const serviceLogger = {
  openai: {
    request: (prompt) => {
      logger.debug('OpenAI request', {
        service: 'openai',
        promptLength: prompt?.length
      });
    },
    response: (tokens, duration) => {
      logger.info('OpenAI response', {
        service: 'openai',
        tokens,
        duration: `${duration}ms`
      });
    },
    error: (error) => {
      logger.error('OpenAI error', error, {
        service: 'openai'
      });
    }
  },

  supabase: {
    query: (table, operation) => {
      logger.debug('Supabase query', {
        service: 'supabase',
        table,
        operation
      });
    },
    success: (table, count) => {
      logger.info('Supabase success', {
        service: 'supabase',
        table,
        count
      });
    },
    error: (error, table) => {
      logger.error('Supabase error', error, {
        service: 'supabase',
        table
      });
    }
  },

  flask: {
    request: (endpoint, data) => {
      logger.debug('Flask request', {
        service: 'flask',
        endpoint,
        dataSize: JSON.stringify(data).length
      });
    },
    response: (statusCode, duration) => {
      logger.info('Flask response', {
        service: 'flask',
        statusCode,
        duration: `${duration}ms`
      });
    },
    error: (error, endpoint) => {
      logger.error('Flask error', error, {
        service: 'flask',
        endpoint
      });
    }
  }
};

export default { logger, requestLogger, errorLogger, serviceLogger };
