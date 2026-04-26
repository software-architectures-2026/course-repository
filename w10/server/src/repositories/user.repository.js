const db = require('../config/db');

async function createUser({ email, password_hash, full_name = null, status = 'active' }) {
	const sql = `
		INSERT INTO users (email, password_hash, full_name, status)
		VALUES ($1, $2, $3, $4)
		RETURNING user_id, email, full_name, status, created_at, updated_at
	`;
	const params = [email, password_hash, full_name, status];
	const res = await db.query(sql, params);
	return res.rows[0];
}

async function getUserById(user_id) {
	const sql = `SELECT user_id, email, full_name, status, created_at, updated_at FROM users WHERE user_id = $1`;
	const res = await db.query(sql, [user_id]);
	return res.rows[0] || null;
}

async function getUserByEmail(email) {
	const sql = `SELECT user_id, email, password_hash, full_name, status, created_at, updated_at FROM users WHERE email = $1`;
	const res = await db.query(sql, [email]);
	return res.rows[0] || null;
}

async function updateUser(user_id, fields = {}) {
	const allowed = ['email', 'password_hash', 'full_name', 'status'];
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
		// nothing to update
		return getUserById(user_id);
	}
	// always update updated_at
	sets.push(`updated_at = NOW()`);
	const sql = `
		UPDATE users SET ${sets.join(', ')}
		WHERE user_id = $${idx}
		RETURNING user_id, email, full_name, status, created_at, updated_at
	`;
	params.push(user_id);
	const res = await db.query(sql, params);
	return res.rows[0] || null;
}

async function deleteUser(user_id, { hard = false } = {}) {
	if (hard) {
		const res = await db.query('DELETE FROM users WHERE user_id = $1', [user_id]);
		return res.rowCount > 0;
	}
	const res = await db.query(
		`UPDATE users SET status = 'deleted', updated_at = NOW() WHERE user_id = $1 RETURNING user_id, email, full_name, status, created_at, updated_at`,
		[user_id]
	);
	return res.rows[0] || null;
}

async function listUsers({ email, status, page = 1, limit = 20 } = {}) {
	const where = [];
	const params = [];
	let idx = 1;
	if (email) {
		where.push(`email ILIKE $${idx}`);
		params.push(`%${email}%`);
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
		SELECT user_id, email, full_name, status, created_at, updated_at
		FROM users
		${whereSql}
		ORDER BY created_at DESC
		LIMIT $${idx} OFFSET $${idx + 1}
	`;
	params.push(limit, offset);
	const res = await db.query(sql, params);
	return res.rows;
}

module.exports = {
	createUser,
	getUserById,
	getUserByEmail,
	updateUser,
	deleteUser,
	listUsers,
};
