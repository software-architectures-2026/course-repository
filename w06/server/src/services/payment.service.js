const db = require('../config/db');
const paymentRepo = require('../repositories/payment.repository');

async function initiatePayment({ reservation_id, amount, method = null, gateway_data = null }) {
	if (!reservation_id || typeof amount === 'undefined') {
		const err = new Error('reservation_id and amount are required');
		err.status = 400;
		throw err;
	}
	if (Number(amount) < 0) {
		const err = new Error('amount must be non-negative');
		err.status = 400;
		throw err;
	}

	// verify reservation exists
	const r = await db.query('SELECT reservation_id, status FROM ticket_reservations WHERE reservation_id = $1', [reservation_id]);
	if (!r.rows[0]) {
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
	}

	const created = await paymentRepo.createPayment({ reservation_id, amount, status: 'pending', method, gateway_response: gateway_data, processed_at: null });
	return created;
}

async function getPayment(payment_id) {
	const p = await paymentRepo.getPaymentById(payment_id);
	if (!p) {
		const err = new Error('Payment not found');
		err.status = 404;
		throw err;
	}
	return p;
}

async function capturePayment(payment_id, { gateway_response = null } = {}) {
	// simple capture: mark payment completed and set processed_at
	const existing = await paymentRepo.getPaymentById(payment_id);
	if (!existing) {
		const err = new Error('Payment not found');
		err.status = 404;
		throw err;
	}
	if (existing.status === 'completed') {
		return existing;
	}

	const updated = await paymentRepo.updatePayment(payment_id, { status: 'completed', gateway_response, processed_at: new Date().toISOString() });
	return updated;
}

async function listPayments(opts = {}) {
	return paymentRepo.listPayments(opts);
}

module.exports = {
	initiatePayment,
	getPayment,
	capturePayment,
	listPayments,
};
