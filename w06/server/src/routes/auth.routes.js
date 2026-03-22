const express = require('express');
const authService = require('../services/auth.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/auth/register', async (req, res, next) => {
	try {
		const created = await authService.register(req.body);
		res.status(201).json(created);
	} catch (err) {
		next(err);
	}
});

router.post('/auth/login', async (req, res, next) => {
	try {
		const resp = await authService.login(req.body);
		res.json(resp);
	} catch (err) {
		next(err);
	}
});

router.post('/auth/logout', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		// Stateless JWT: nothing to do server-side for basic logout
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

router.get('/auth/me', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		// auth middleware attaches `req.user`
		res.json(req.user);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
