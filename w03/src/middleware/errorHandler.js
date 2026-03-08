// Centralized error handling middleware
const {
  NotFoundError,
  ConflictError,
  PaymentFailedError,
} = require('../services/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
  } else if (err instanceof PaymentFailedError) {
    res.status(402).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = errorHandler;
