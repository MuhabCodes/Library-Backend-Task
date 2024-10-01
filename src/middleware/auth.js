const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  logger.info(`Auth header received: ${authHeader}`);

  if (!authHeader) {
    logger.warn('No Authorization header provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Check if the auth header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    logger.warn('Invalid Authorization header format');
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    logger.info(`User authenticated: ${decoded.username}`);
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return res.status(403).json({ message: 'Token is not valid' });
  }
};