// Domain-specific error classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

class PaymentFailedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentFailedError';
  }
}

module.exports = {
  NotFoundError,
  ConflictError,
  PaymentFailedError,
};
