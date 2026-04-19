const express = require('express');
const reservationService = require('../services/reservation.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/events/:event_id/reservations', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { event_id } = req.params;
		const { status } = req.query;
		const opts = { event_id };
		if (status) opts.status = status;
		const list = await reservationService.listReservations(opts);
		res.json(list);
	} catch (err) {
		next(err);
	}
});

router.post('/events/:event_id/reservations', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { event_id } = req.params;
		const actor_id = req.headers['x-user-id'] || req.body.user_id;
		const { ticket_type_id, seat, expires_at, metadata } = req.body;
		const created = await reservationService.createReservation({ event_id, user_id: actor_id, ticket_type_id, seat, expires_at, metadata });
		res.status(201).json(created);
	} catch (err) {
		next(err);
	}
});

router.get('/reservations/:reservation_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const r = await reservationService.getReservation(req.params.reservation_id);
		res.json(r);
	} catch (err) {
		next(err);
	}
});

router.patch('/reservations/:reservation_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const actor_id = req.headers['x-user-id'] || req.body.user_id;
		const updated = await reservationService.updateReservation(req.params.reservation_id, actor_id, req.body);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.delete('/reservations/:reservation_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const hard = req.query && req.query.hard === 'true';
		const actor_id = req.headers['x-user-id'];
		await reservationService.deleteReservation(req.params.reservation_id, actor_id, { hard });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

router.post('/reservations/:reservation_id/cancel', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const actor_id = req.headers['x-user-id'];
		const updated = await reservationService.cancelReservation(req.params.reservation_id, actor_id);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
