class AppError extends Error {
  constructor(message = 'An error occurred', { code = 'INTERNAL_ERROR', status = 500, details = null } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', { code = 'VALIDATION_ERROR', details = [] } = {}) {
    super(message, { code, status: 400, details });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', { code = 'AUTHENTICATION_ERROR' } = {}) {
    super(message, { code, status: 401 });
  }
}

class AuthenticationError2 extends AppError {
  constructor(message = 'Invalid credentials', { code = 'AUTHENTICATION_ERROR' } = {}) {
    super(message, { code, status: 401 });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Forbidden', { code = 'AUTHORIZATION_ERROR' } = {}) {
    super(message, { code, status: 403 });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', { code = 'RESOURCE_NOT_FOUND' } = {}) {
    super(message, { code, status: 404 });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', { code = 'CONFLICT_ERROR' } = {}) {
    super(message, { code, status: 409 });
  }
}

class BusinessRuleError extends AppError {
  constructor(message = 'Business rule violation', { code = 'BUSINESS_RULE_VIOLATION' } = {}) {
    super(message, { code, status: 422 });
  }
}

class PaymentFailureError extends AppError {
  constructor(message = 'Payment failed', { code = 'PAYMENT_FAILURE', status = 402 } = {}) {
    super(message, { code, status });
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error', { code = 'EXTERNAL_SERVICE_ERROR', status = 502 } = {}) {
    super(message, { code, status });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', { code = 'RATE_LIMITED' } = {}) {
    super(message, { code, status: 429 });
  }
}

class InternalError extends AppError {
  constructor(message = 'Internal server error', { code = 'INTERNAL_ERROR' } = {}) {
    super(message, { code, status: 500 });
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthenticationError2,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  PaymentFailureError,
  ExternalServiceError,
  RateLimitError,
  InternalError,
};
