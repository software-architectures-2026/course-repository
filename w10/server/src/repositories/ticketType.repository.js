const db = require('../config/db');

async function createTicketType({ event_id, name, price, quantity, metadata = {} }) {
	const sql = `
		INSERT INTO ticket_types (event_id, name, price, quantity, metadata)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at
	`;
	const params = [event_id, name, price, quantity, metadata];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getTicketTypeById(ticket_type_id) {
	const sql = `
		SELECT ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at
		FROM ticket_types WHERE ticket_type_id = $1
	`;
	const res = await db.query(sql, [ticket_type_id]);
	return res.rows[0] || null;
}

async function updateTicketType(ticket_type_id, fields = {}) {
	const allowed = ['event_id', 'name', 'price', 'quantity', 'metadata'];
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
		return getTicketTypeById(ticket_type_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE ticket_types SET ${sets.join(', ')}
		WHERE ticket_type_id = $${idx}
		RETURNING ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at
	`;
	params.push(ticket_type_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function deleteTicketType(ticket_type_id, { hard = false } = {}) {
	if (hard) {
		const res = await db.query('DELETE FROM ticket_types WHERE ticket_type_id = $1', [ticket_type_id]);
		return res.rowCount > 0;
	}
	// soft-delete: set quantity to 0
	const res = await db.query(
		`UPDATE ticket_types SET quantity = 0, updated_at = NOW() WHERE ticket_type_id = $1 RETURNING ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at`,
		[ticket_type_id]
	);
	return res.rows[0] || null;
}

async function listTicketTypesByEvent(event_id) {
	const sql = `
		SELECT ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at
		FROM ticket_types WHERE event_id = $1 ORDER BY created_at ASC
	`;
	const res = await db.query(sql, [event_id]);
	return res.rows;
}

async function listTicketTypes({ event_id, min_price, max_price, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (event_id) {
		where.push(`event_id = $${idx}`);
		params.push(event_id);
		idx++;
	}
	if (min_price !== undefined) {
		where.push(`price >= $${idx}`);
		params.push(min_price);
		idx++;
	}
	if (max_price !== undefined) {
		where.push(`price <= $${idx}`);
		params.push(max_price);
		idx++;
	}
	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
	const offset = (Math.max(page, 1) - 1) * limit;
	const sql = `
		SELECT ticket_type_id, event_id, name, price, quantity, metadata, created_at, updated_at
		FROM ticket_types
		${whereSql}
		ORDER BY created_at DESC
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

module.exports = {
	createTicketType,
	getTicketTypeById,
	updateTicketType,
	deleteTicketType,
	listTicketTypesByEvent,
	listTicketTypes,
};
