const crypto = require('crypto');
const { AppError } = require('../errors');

function generateTraceId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function errorHandler(err, req, res, next) {
  const traceId = generateTraceId();

  // Always log full error with traceId for server-side debugging
  console.error(`[${traceId}] Unhandled error:`, err && err.stack ? err.stack : err);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details;

  if (err instanceof AppError) {
    status = err.status || status;
    code = err.code || code;
    message = err.message || message;
    details = err.details;
  }

  // Treat several related codes as authentication errors so clients get a unified response.
  const authAliases = new Set(['AUTHENTICATION_ERROR', 'AUTHENTICATION_REQUIRED', 'AUTHENTICATION_FAILED', 'INVALID_TOKEN', 'TOKEN_EXPIRED']);
  if (authAliases.has(code) || err && err.status === 401) {
    status = 401;
    code = 'AUTHENTICATION_ERROR';
    // prefer explicit message from error, otherwise a generic one
    message = err && err.message ? err.message : 'Authentication required';
  }

  const isDev = process.env.NODE_ENV !== 'production';

  const payload = { code, message, traceId };
  if (details !== undefined && details !== null) payload.details = details;
  if (isDev) payload.debug = { originalMessage: err && err.message, stack: err && err.stack };

  // Expose trace id as a header too
  res.setHeader('X-Trace-Id', traceId);
  res.status(status).json(payload);
}

module.exports = errorHandler;
// Middleware: central error handler

// TODO: implement middleware
