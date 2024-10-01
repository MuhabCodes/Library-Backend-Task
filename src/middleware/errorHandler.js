const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    error: err,
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    user: req.user ? req.user.username : 'unauthenticated',
  });

  // Determine the status code
  const statusCode = err.status || 500;

  // Prepare the error response
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
    },
  };

  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send the error response
  return res.status(statusCode).json(errorResponse);
};