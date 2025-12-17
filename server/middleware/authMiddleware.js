const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Asegurarse de usar el mismo secreto que el servidor utiliza al firmar tokens.
// En index.js se define un fallback si JWT_SECRET no está en el entorno,
// aquí replicamos esa lógica para que la verificación no falle.
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token;

  if (token == null) {
    // Only log in debug mode - this is a normal occurrence
    logger.debug('No authentication token provided');
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      // Only log actual errors (not expired tokens, which are handled by auto-refresh)
      if (err.name === 'TokenExpiredError') {
        logger.debug(`Token expired for request to ${req.path}`);
      } else {
        logger.auth('error', 'Token verification failed:', err.message);
      }
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Verify session if ID is present in token
      if (user.sessionId) {
        const session = await prisma.sesionUsuario.findUnique({
          where: { id: user.sessionId }
        });

        if (!session || !session.activa) {
          return res.status(403).json({ message: 'Session invalidated or expired' });
        }
      }
    } catch (e) {
      logger.error(`Session verification error: ${e.message}`);
      
      // Si es un error de conexión pero tenemos un token válido, continuar
      const isConnectionError = 
        e.message?.includes('Can\'t reach database server') ||
        e.message?.includes('Connection refused') ||
        e.message?.includes('timeout') ||
        e.code === 'P1001' || 
        e.code === 'P1008' || 
        e.code === 'P1017';
      
      if (isConnectionError && user.sessionId) {
        logger.warn('Database connection error during session verification, but token is valid - allowing access');
        // Continuar con el usuario del token sin verificar la sesión
        req.user = user;
        return next();
      }
      
      // Para otros errores, fallar de forma segura
      return res.status(500).json({ message: 'Internal server error during auth' });
    }

    // Success - no logging needed (reduces noise)
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes('Administrador')) {
    return res.status(403).json({ message: 'Access denied. Administrator role required.' });
  }
  next();
};

module.exports = { authenticateToken, authorizeAdmin };
