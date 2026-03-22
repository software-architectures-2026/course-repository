const express = require('express');
const ticketService = require('../services/ticket.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/tickets', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { event_id, user_id, status, page, limit } = req.query;
		const opts = {};
		if (event_id) opts.event_id = event_id;
		if (user_id) opts.user_id = user_id;
		if (status) opts.status = status;
		if (page) opts.page = Number(page);
		if (limit) opts.limit = Number(limit);
		const list = await ticketService.listTickets(opts);
		res.json(list);
	} catch (err) {
		next(err);
	}
});

router.get('/tickets/:ticket_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const t = await ticketService.getTicket(req.params.ticket_id);
		res.json(t);
	} catch (err) {
		next(err);
	}
});

router.get('/users/:user_id/tickets', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const list = await ticketService.listTicketsByUser(req.params.user_id);
		res.json(list);
	} catch (err) {
		next(err);
	}
});

router.post('/reservations/:reservation_id/tickets', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { reservation_id } = req.params;
		const ticket = await ticketService.issueTicketForReservation(reservation_id);
		res.status(201).json(ticket);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
