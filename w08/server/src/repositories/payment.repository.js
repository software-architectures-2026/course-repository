const db = require('../config/db');

async function createPayment({ reservation_id, amount, status = 'pending', method = null, gateway_response = null, processed_at = null }) {
	const sql = `
		INSERT INTO payments (reservation_id, amount, status, method, gateway_response, processed_at)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING payment_id, reservation_id, amount, status, method, gateway_response, processed_at, created_at, updated_at
	`;
	const params = [reservation_id, amount, status, method, gateway_response, processed_at];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getPaymentById(payment_id) {
	const sql = `
		SELECT payment_id, reservation_id, amount, status, method, gateway_response, processed_at, created_at, updated_at
		FROM payments WHERE payment_id = $1
	`;
	const res = await db.query(sql, [payment_id]);
	return res.rows[0] || null;
}

async function updatePayment(payment_id, fields = {}) {
	const allowed = ['reservation_id', 'amount', 'status', 'method', 'gateway_response', 'processed_at'];
	const sets = [];
	const params = [];
	let idx = 1;
	for (const key of allowed) {
		if (Object.prototype.hasOwnProperty.call(fields, key)) {
			sets.push(`${key} = $${idx}`);
			params.push(fields[key]);
			idx++;
		}
	}
	if (sets.length === 0) {
		return getPaymentById(payment_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE payments SET ${sets.join(', ')}
		WHERE payment_id = $${idx}
		RETURNING payment_id, reservation_id, amount, status, method, gateway_response, processed_at, created_at, updated_at
	`;
	params.push(payment_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function listPayments({ reservation_id, status, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (reservation_id) {
		where.push(`reservation_id = $${idx}`);
		params.push(reservation_id);
		idx++;
	}
	if (status) {
		where.push(`status = $${idx}`);
		params.push(status);
		idx++;
	}
	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
	const offset = (Math.max(page, 1) - 1) * limit;
	const sql = `
		SELECT payment_id, reservation_id, amount, status, method, gateway_response, processed_at, created_at, updated_at
		FROM payments
		${whereSql}
		ORDER BY created_at DESC
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

module.exports = {
	createPayment,
	getPaymentById,
	updatePayment,
	listPayments,
};
