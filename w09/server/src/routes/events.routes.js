const express = require('express');
const eventService = require('../services/event.service');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const Joi = require('joi');

const router = express.Router();

router.get('/events', async (req, res, next) => {
	try {
		const {
			q,
			start_from,
			start_to,
			location,
			category,
			min_price,
			max_price,
			published,
			organizer_id,
			sort,
			page,
			limit,
		} = req.query;
		const opts = {};
		if (q) opts.q = q;
		if (start_from) opts.start_from = start_from;
		if (start_to) opts.start_to = start_to;
		if (location) opts.location = location;
		if (category) opts.category = category;
		if (min_price) opts.min_price = Number(min_price);
		if (max_price) opts.max_price = Number(max_price);
		if (typeof published !== 'undefined') opts.published = published === 'true' || published === '1';
		if (organizer_id) opts.organizer_id = organizer_id;
		if (sort) opts.sort = sort;
		if (page) opts.page = Number(page);
		if (limit) opts.limit = Number(limit);

		const events = await eventService.listEvents(opts);
		res.json(events);
	} catch (err) {
		next(err);
	}
});

const createEventSchema = Joi.object({
	title: Joi.string().required(),
	location: Joi.string().required(),
	start_time: Joi.date().iso().required(),
	end_time: Joi.date().iso().optional(),
	description: Joi.string().optional(),
});

router.post('/events', authMiddleware.authenticateRequired, validate({ body: createEventSchema }), async (req, res, next) => {
	try {
		const actor_id = req.user && req.user.user_id;
		const payload = Object.assign({}, req.body, { organizer_id: actor_id });
		const created = await eventService.createEvent(payload);
		res.status(201).json(created);
	} catch (err) {
		next(err);
	}
});

router.get('/events/:event_id', async (req, res, next) => {
	try {
		const ev = await eventService.getEvent(req.params.event_id);
		res.json(ev);
	} catch (err) {
		next(err);
	}
});

router.put('/events/:event_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const actor_id = req.user && req.user.user_id;
		const updated = await eventService.updateEvent(req.params.event_id, actor_id, req.body);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.patch('/events/:event_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const actor_id = req.user && req.user.user_id;
		const updated = await eventService.updateEvent(req.params.event_id, actor_id, req.body);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.delete('/events/:event_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const hard = req.query && req.query.hard === 'true';
		const actor_id = req.user && req.user.user_id;
		await eventService.deleteEvent(req.params.event_id, actor_id, { hard });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

router.post('/events/:event_id/publish', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const actor_id = req.user && req.user.user_id;
		const { published } = req.body;
		const updated = await eventService.publishEvent(req.params.event_id, actor_id, !!published);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.get('/events/:event_id/attendees', async (req, res, next) => {
	try {
		// Attendees listing relies on reservations/tickets; not implemented yet.
		// Return empty array for now.
		res.json([]);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
