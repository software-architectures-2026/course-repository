const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');

const VALID_STATUSES = ['active', 'deactivated', 'deleted'];

async function registerUser({ email, password, full_name }) {
	if (!email || !password) {
		const err = new Error('Email and password are required');
		err.status = 400;
		throw err;
	}

	const existing = await userRepo.getUserByEmail(email);
	if (existing) {
		const err = new Error('Email already registered');
		err.status = 409;
		throw err;
	}

	const password_hash = await bcrypt.hash(password, 10);
	const created = await userRepo.createUser({ email, password_hash, full_name, status: 'active' });
	return created;
}

async function createUserAdmin({ email, password, full_name, status = 'active' }) {
	if (!email || !password) {
		const err = new Error('Email and password are required');
		err.status = 400;
		throw err;
	}
	if (!VALID_STATUSES.includes(status)) {
		const err = new Error('Invalid status');
		err.status = 400;
		throw err;
	}
	const existing = await userRepo.getUserByEmail(email);
	if (existing) {
		const err = new Error('Email already registered');
		err.status = 409;
		throw err;
	}
	const password_hash = await bcrypt.hash(password, 10);
	const created = await userRepo.createUser({ email, password_hash, full_name, status });
	return created;
}

async function getUser(user_id) {
	const user = await userRepo.getUserById(user_id);
	if (!user) {
		const err = new Error('User not found');
		err.status = 404;
		throw err;
	}
	return user;
}

async function listUsers(opts = {}) {
	return userRepo.listUsers(opts);
}

async function updateUser(user_id, fields = {}) {
	if (fields.status && !VALID_STATUSES.includes(fields.status)) {
		const err = new Error('Invalid status');
		err.status = 400;
		throw err;
	}

	if (fields.email) {
		const existing = await userRepo.getUserByEmail(fields.email);
		if (existing && existing.user_id !== user_id) {
			const err = new Error('Email already in use');
			err.status = 409;
			throw err;
		}
	}

	const updateFields = { ...fields };
	if (fields.password) {
		updateFields.password_hash = await bcrypt.hash(fields.password, 10);
		delete updateFields.password;
	}

	const updated = await userRepo.updateUser(user_id, updateFields);
	if (!updated) {
		const err = new Error('User not found');
		err.status = 404;
		throw err;
	}
	return updated;
}

async function deleteUser(user_id, { hard = false } = {}) {
	const res = await userRepo.deleteUser(user_id, { hard });
	if (!res) {
		const err = new Error('User not found');
		err.status = 404;
		throw err;
	}
	return res;
}

module.exports = {
	registerUser,
	createUserAdmin,
	getUser,
	listUsers,
	updateUser,
	deleteUser,
};
