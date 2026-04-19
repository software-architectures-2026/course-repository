const db = require('../config/db');

async function createReservation({ event_id, user_id, ticket_type_id, seat = null, status = 'active', expires_at = null, metadata = {} }) {
	const sql = `
		INSERT INTO ticket_reservations (event_id, user_id, ticket_type_id, seat, status, expires_at, metadata)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at
	`;
	const params = [event_id, user_id, ticket_type_id, seat, status, expires_at, metadata];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getReservationById(reservation_id) {
	const sql = `
		SELECT reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at
		FROM ticket_reservations WHERE reservation_id = $1
	`;
	const res = await db.query(sql, [reservation_id]);
	return res.rows[0] || null;
}

async function updateReservation(reservation_id, fields = {}) {
	const allowed = ['event_id', 'user_id', 'ticket_type_id', 'seat', 'status', 'expires_at', 'metadata'];
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
		return getReservationById(reservation_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE ticket_reservations SET ${sets.join(', ')}
		WHERE reservation_id = $${idx}
		RETURNING reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at
	`;
	params.push(reservation_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function deleteReservation(reservation_id, { hard = false } = {}) {
	if (hard) {
		const res = await db.query('DELETE FROM ticket_reservations WHERE reservation_id = $1', [reservation_id]);
		return res.rowCount > 0;
	}
	// soft-delete: mark cancelled
	const res = await db.query(
		`UPDATE ticket_reservations SET status = 'cancelled', updated_at = NOW() WHERE reservation_id = $1 RETURNING reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at`,
		[reservation_id]
	);
	return res.rows[0] || null;
}

async function listReservations({ event_id, user_id, status, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (event_id) {
		where.push(`event_id = $${idx}`);
		params.push(event_id);
		idx++;
	}
	if (user_id) {
		where.push(`user_id = $${idx}`);
		params.push(user_id);
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
		SELECT reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at
		FROM ticket_reservations
		${whereSql}
		ORDER BY created_at DESC
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

async function findActiveByEventSeat(event_id, seat) {
	const sql = `
		SELECT reservation_id, event_id, user_id, ticket_type_id, seat, status, expires_at, metadata, created_at, updated_at
		FROM ticket_reservations
		WHERE event_id = $1 AND seat = $2 AND status = 'active'
	`;
	const res = await db.query(sql, [event_id, seat]);
	return res.rows[0] || null;
}

module.exports = {
	createReservation,
	getReservationById,
	updateReservation,
	deleteReservation,
	listReservations,
	findActiveByEventSeat,
};
