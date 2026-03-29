const db = require('../config/db');

async function createEvent({ organizer_id, title, description = null, category = null, location, start_time, end_time, visibility = false, published = false, metadata = {} }) {
	const sql = `
		INSERT INTO events (organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at
	`;
	const params = [organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getEventById(event_id) {
	const sql = `
		SELECT event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at
		FROM events WHERE event_id = $1
	`;
	const res = await db.query(sql, [event_id]);
	return res.rows[0] || null;
}

async function updateEvent(event_id, fields = {}) {
	const allowed = ['organizer_id', 'title', 'description', 'category', 'location', 'start_time', 'end_time', 'visibility', 'published', 'metadata'];
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
		return getEventById(event_id);
	}
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE events SET ${sets.join(', ')}
		WHERE event_id = $${idx}
		RETURNING event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at
	`;
	params.push(event_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function deleteEvent(event_id, { hard = false } = {}) {
	if (hard) {
		const res = await db.query('DELETE FROM events WHERE event_id = $1', [event_id]);
		return res.rowCount > 0;
	}
	// soft-delete: mark visibility and published false
	const res = await db.query(
		`UPDATE events SET visibility = FALSE, published = FALSE, updated_at = NOW() WHERE event_id = $1 RETURNING event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at`,
		[event_id]
	);
	return res.rows[0] || null;
}

async function listEvents({ q, start_from, start_to, location, category, min_price, max_price, published, organizer_id, sort, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	let joinTicketTypes = false;
	if (q) {
		where.push(`(title ILIKE $${idx} OR coalesce(description,'') ILIKE $${idx})`);
		params.push(`%${q}%`);
		idx++;
	}
	if (start_from) {
		where.push(`start_time >= $${idx}`);
		params.push(start_from);
		idx++;
	}
	if (start_to) {
		where.push(`start_time <= $${idx}`);
		params.push(start_to);
		idx++;
	}
	if (location) {
		where.push(`location ILIKE $${idx}`);
		params.push(`%${location}%`);
		idx++;
	}
	if (category) {
		where.push(`category = $${idx}`);
		params.push(category);
		idx++;
	}
	if (typeof published !== 'undefined') {
		where.push(`published = $${idx}`);
		params.push(published);
		idx++;
	}
	if (organizer_id) {
		where.push(`organizer_id = $${idx}`);
		params.push(organizer_id);
		idx++;
	}
	if (min_price !== undefined || max_price !== undefined) {
		joinTicketTypes = true;
		if (min_price !== undefined) {
			where.push(`t.price >= $${idx}`);
			params.push(min_price);
			idx++;
		}
		if (max_price !== undefined) {
			where.push(`t.price <= $${idx}`);
			params.push(max_price);
			idx++;
		}
	}

	const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
	const offset = (Math.max(page, 1) - 1) * limit;
	let orderBy = 'e.created_at DESC';
	if (sort) {
		switch (sort) {
			case 'start_time_asc':
				orderBy = 'e.start_time ASC';
				break;
			case 'start_time_desc':
				orderBy = 'e.start_time DESC';
				break;
			case 'price_asc':
				orderBy = 'min_price ASC';
				break;
			case 'price_desc':
				orderBy = 'max_price DESC';
				break;
			default:
				orderBy = 'e.created_at DESC';
		}
	}

	if (joinTicketTypes) {
		// join ticket_types to allow price filtering and ordering
		const sql = `
			SELECT DISTINCT e.event_id, e.organizer_id, e.title, e.description, e.category, e.location, e.start_time, e.end_time, e.visibility, e.published, e.metadata, e.created_at, e.updated_at,
				MIN(t.price) OVER (PARTITION BY e.event_id) AS min_price,
				MAX(t.price) OVER (PARTITION BY e.event_id) AS max_price
			FROM events e
			JOIN ticket_types t ON t.event_id = e.event_id
			${whereSql}
			ORDER BY ${orderBy}
			LIMIT $${idx} OFFSET $${idx + 1}
		`;
		params.push(limit, offset);
		const res = await db.query(sql, params);
		return res.rows;
	}

	const sql = `
		SELECT e.event_id, e.organizer_id, e.title, e.description, e.category, e.location, e.start_time, e.end_time, e.visibility, e.published, e.metadata, e.created_at, e.updated_at
		FROM events e
		${whereSql}
		ORDER BY ${orderBy}
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

async function setPublishStatus(event_id, published) {
	const sql = `
		UPDATE events SET published = $1, updated_at = NOW()
		WHERE event_id = $2
		RETURNING event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at
	`;
	const res = await db.query(sql, [published, event_id]);
	return res.rows[0] || null;
}

async function listUnpublished() {
	const sql = `SELECT event_id, organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata, created_at, updated_at FROM events WHERE published = FALSE ORDER BY created_at DESC`;
	const res = await db.query(sql);
	return res.rows;
}

module.exports = {
	createEvent,
	getEventById,
	updateEvent,
	deleteEvent,
	listEvents,
	setPublishStatus,
	listUnpublished,
};
