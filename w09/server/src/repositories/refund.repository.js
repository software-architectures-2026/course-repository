const db = require('../config/db');

async function createRefund({ payment_id, reservation_id, amount, status = 'pending', metadata = null }) {
	const sql = `
		INSERT INTO refunds (payment_id, reservation_id, amount, status, metadata)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING refund_id, payment_id, reservation_id, amount, status, requested_at, processed_at, metadata, created_at, updated_at
	`;
	const params = [payment_id, reservation_id, amount, status, metadata];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getRefundById(refund_id) {
	const sql = `
		SELECT refund_id, payment_id, reservation_id, amount, status, requested_at, processed_at, metadata, created_at, updated_at
		FROM refunds WHERE refund_id = $1
	`;
	const res = await db.query(sql, [refund_id]);
	return res.rows[0] || null;
}

async function updateRefund(refund_id, fields = {}) {
	const allowed = ['payment_id', 'reservation_id', 'amount', 'status', 'processed_at', 'metadata'];
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
		return getRefundById(refund_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE refunds SET ${sets.join(', ')}
		WHERE refund_id = $${idx}
		RETURNING refund_id, payment_id, reservation_id, amount, status, requested_at, processed_at, metadata, created_at, updated_at
	`;
	params.push(refund_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function listRefunds({ payment_id, reservation_id, status, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (payment_id) {
		where.push(`payment_id = $${idx}`);
		params.push(payment_id);
		idx++;
	}
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
		SELECT refund_id, payment_id, reservation_id, amount, status, requested_at, processed_at, metadata, created_at, updated_at
		FROM refunds
		${whereSql}
		ORDER BY requested_at DESC
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

module.exports = {
	createRefund,
	getRefundById,
	updateRefund,
	listRefunds,
};
