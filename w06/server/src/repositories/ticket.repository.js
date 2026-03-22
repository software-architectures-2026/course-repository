const db = require('../config/db');

async function createTicket({ ticket_type_id, reservation_id = null, user_id = null, seat = null, status = 'issued', issued_at = null, metadata = {} }) {
	const sql = `
		INSERT INTO tickets (ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata)
		VALUES ($1,$2,$3,$4,$5, $6, $7)
		RETURNING ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at
	`;
	const params = [ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getTicketById(ticket_id) {
	const sql = `
		SELECT ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at
		FROM tickets WHERE ticket_id = $1
	`;
	const res = await db.query(sql, [ticket_id]);
	return res.rows[0] || null;
}

async function updateTicket(ticket_id, fields = {}) {
	const allowed = ['ticket_type_id', 'reservation_id', 'user_id', 'seat', 'status', 'issued_at', 'metadata'];
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
		return getTicketById(ticket_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE tickets SET ${sets.join(', ')}
		WHERE ticket_id = $${idx}
		RETURNING ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at
	`;
	params.push(ticket_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function listTickets({ event_id, user_id, page = 1, limit = 20, status } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (event_id) {
		// join with ticket_types to filter by event
		where.push(`tt.event_id = $${idx}`);
		params.push(event_id);
		idx++;
	}
	if (user_id) {
		where.push(`t.user_id = $${idx}`);
		params.push(user_id);
		idx++;
	}
	if (status) {
		where.push(`t.status = $${idx}`);
		params.push(status);
		idx++;
	}
	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
	const offset = (Math.max(page, 1) - 1) * limit;
	let sql;
	if (event_id) {
		sql = `
			SELECT t.ticket_id, t.ticket_type_id, t.reservation_id, t.user_id, t.seat, t.status, t.issued_at, t.metadata, t.created_at, t.updated_at
			FROM tickets t
			JOIN ticket_types tt ON tt.ticket_type_id = t.ticket_type_id
			${whereSql}
			ORDER BY t.created_at DESC
			LIMIT $${idx} OFFSET $${idx + 1}
		`;
	} else {
		sql = `
			SELECT t.ticket_id, t.ticket_type_id, t.reservation_id, t.user_id, t.seat, t.status, t.issued_at, t.metadata, t.created_at, t.updated_at
			FROM tickets t
			${whereSql}
			ORDER BY t.created_at DESC
			LIMIT $${idx} OFFSET $${idx + 1}
		`;
	}
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

async function listTicketsByReservation(reservation_id) {
	const sql = `
		SELECT ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at
		FROM tickets WHERE reservation_id = $1 ORDER BY created_at DESC
	`;
	const res = await db.query(sql, [reservation_id]);
	return res.rows;
}

async function listTicketsByUser(user_id) {
	const sql = `
		SELECT ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at
		FROM tickets WHERE user_id = $1 ORDER BY created_at DESC
	`;
	const res = await db.query(sql, [user_id]);
	return res.rows;
}

module.exports = {
	createTicket,
	getTicketById,
	updateTicket,
	listTickets,
	listTicketsByReservation,
	listTicketsByUser,
};
