const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');

// Optional authentication middleware: if Authorization header present, verify and attach user
async function authenticateOptional(req, res, next) {
	try {
		const hdr = req.headers['authorization'] || req.headers['Authorization'];
		if (!hdr) return next();
		const parts = hdr.split(' ');
		if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return next();
		const token = parts[1];
		const payload = authService.verifyToken(token);
		if (!payload) return next();
		const user = await userRepo.getUserById(payload.user_id);
		if (user) {
			req.user = user;
			// keep compatibility with existing code that reads x-user-id header
			req.headers['x-user-id'] = user.user_id;
		}
		return next();
	} catch (err) {
		return next();
	}
}

// Required authentication middleware: responds 401 if token missing/invalid
async function authenticateRequired(req, res, next) {
	try {
		const hdr = req.headers['authorization'] || req.headers['Authorization'];
		if (!hdr) {
			const err = new Error('Unauthorized');
			err.status = 401;
			return next(err);
		}
		const parts = hdr.split(' ');
		if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
			const err = new Error('Unauthorized');
			err.status = 401;
			return next(err);
		}
		const token = parts[1];
		const payload = authService.verifyToken(token);
		if (!payload) {
			const err = new Error('Unauthorized');
			err.status = 401;
			return next(err);
		}
		const user = await userRepo.getUserById(payload.user_id);
		if (!user) {
			const err = new Error('Unauthorized');
			err.status = 401;
			return next(err);
		}
		req.user = user;
		req.headers['x-user-id'] = user.user_id;
		return next();
	} catch (err) {
		const e = new Error('Unauthorized');
		e.status = 401;
		return next(e);
	}
}

module.exports = {
	authenticateOptional,
	authenticateRequired,
};
