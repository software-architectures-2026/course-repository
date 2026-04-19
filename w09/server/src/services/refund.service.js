const db = require('../config/db');
const refundRepo = require('../repositories/refund.repository');
const paymentRepo = require('../repositories/payment.repository');

const VALID_STATUSES = ['pending', 'processed', 'failed'];

async function createRefund({ payment_id, reservation_id, amount, reason = null, metadata = null }) {
  if (!payment_id || !reservation_id || typeof amount === 'undefined') {
    const err = new Error('payment_id, reservation_id and amount are required');
    err.status = 400;
    throw err;
  }
  if (Number(amount) < 0) {
    const err = new Error('amount must be non-negative');
    err.status = 400;
    throw err;
  }

  const payment = await paymentRepo.getPaymentById(payment_id);
  if (!payment) {
    const err = new Error('Payment not found');
    err.status = 404;
    throw err;
  }

  if (payment.reservation_id !== reservation_id) {
    const err = new Error('Reservation does not match payment');
    err.status = 400;
    throw err;
  }

  // prevent refund greater than payment amount
  if (Number(amount) > Number(payment.amount)) {
    const err = new Error('Refund amount cannot exceed original payment amount');
    err.status = 400;
    throw err;
  }

  // create refund record (status pending)
  const created = await refundRepo.createRefund({ payment_id, reservation_id, amount, status: 'pending', metadata });
  return created;
}

async function getRefund(refund_id) {
  const r = await refundRepo.getRefundById(refund_id);
  if (!r) {
    const err = new Error('Refund not found');
    err.status = 404;
    throw err;
  }
  return r;
}

async function updateRefund(refund_id, fields = {}) {
  if (fields.status && !VALID_STATUSES.includes(fields.status)) {
    const err = new Error('Invalid refund status');
    err.status = 400;
    throw err;
  }

  const existing = await refundRepo.getRefundById(refund_id);
  if (!existing) {
    const err = new Error('Refund not found');
    err.status = 404;
    throw err;
  }

  const updateFields = { ...fields };
  if (fields.status === 'processed' && !fields.processed_at) {
    updateFields.processed_at = new Date().toISOString();
  }

  const updated = await refundRepo.updateRefund(refund_id, updateFields);
  return updated;
}

async function listRefunds(opts = {}) {
  return refundRepo.listRefunds(opts);
}

module.exports = {
  createRefund,
  getRefund,
  updateRefund,
  listRefunds,
};
// Business logic layer: refund service (eligibility, process refunds)

// TODO: implement service methods
