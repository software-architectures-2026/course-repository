const express = require('express');
const ticketTypeService = require('../services/ticketType.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/events/:event_id/ticket-types', async (req, res, next) => {
  try {
    const list = await ticketTypeService.listTicketTypesByEvent(req.params.event_id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/events/:event_id/ticket-types', authMiddleware.authenticateRequired, async (req, res, next) => {
  try {
    const actor_id = req.headers['x-user-id'] || req.body.organizer_id;
    const payload = Object.assign({}, req.body, { event_id: req.params.event_id });
    // service.createTicketType will validate fields
    const created = await ticketTypeService.createTicketType(payload, actor_id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get('/ticket-types/:ticket_type_id', async (req, res, next) => {
  try {
    const tt = await ticketTypeService.getTicketType(req.params.ticket_type_id);
    res.json(tt);
  } catch (err) {
    next(err);
  }
});

router.put('/ticket-types/:ticket_type_id', authMiddleware.authenticateRequired, async (req, res, next) => {
  try {
    const actor_id = req.headers['x-user-id'] || req.body.organizer_id;
    const updated = await ticketTypeService.updateTicketType(req.params.ticket_type_id, actor_id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/ticket-types/:ticket_type_id', authMiddleware.authenticateRequired, async (req, res, next) => {
  try {
    const actor_id = req.headers['x-user-id'] || req.body.organizer_id;
    const updated = await ticketTypeService.updateTicketType(req.params.ticket_type_id, actor_id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/ticket-types/:ticket_type_id', authMiddleware.authenticateRequired, async (req, res, next) => {
  try {
    const hard = req.query && req.query.hard === 'true';
    const actor_id = req.headers['x-user-id'];
    await ticketTypeService.deleteTicketType(req.params.ticket_type_id, actor_id, { hard });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// Presentation layer: ticket type routes (nested under events)

// TODO: implement route registrations
