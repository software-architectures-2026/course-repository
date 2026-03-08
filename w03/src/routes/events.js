// Routes Layer: HTTP for Events

const express = require('express');
const router = express.Router();
const eventsService = require('../services/eventsService');

// GET /api/events — list all events
router.get('/', async (req, res) => {
  try {
    const events = await eventsService.listEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;
