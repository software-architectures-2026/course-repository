// Routes Layer: HTTP for Ticket Purchasing
const express = require('express');
const router = express.Router();
const ticketsService = require('../services/ticketsService');

// POST /api/tickets/purchase
router.post('/purchase', async (req, res, next) => {
  const { eventId, seatId, userId, amount } = req.body;
  try {
    const result = await ticketsService.purchaseTicket({ eventId, seatId, userId, amount });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
