const express = require('express');
const salesService = require('../services/sales.service');

const router = express.Router();

// Get aggregated sales for an event
router.get('/events/:event_id/sales', async (req, res, next) => {
  try {
    const sd = await salesService.getSalesForEvent(req.params.event_id);
    res.json(sd);
  } catch (err) {
    next(err);
  }
});

// Trigger asynchronous recompute of sales metrics for an event
router.post('/events/:event_id/sales', async (req, res, next) => {
  try {
    await salesService.triggerRecompute(req.params.event_id);
    res.status(202).json({ accepted: true });
  } catch (err) {
    next(err);
  }
});

// Global sales listing / report
router.get('/sales', async (req, res, next) => {
  try {
    const { start, end, organizer_id, export: exportFmt, page, limit } = req.query;
    const opts = {};
    if (start) opts.start = start;
    if (end) opts.end = end;
    if (organizer_id) opts.organizer_id = organizer_id;
    if (page) opts.page = Number(page);
    if (limit) opts.limit = Number(limit);

    const list = await salesService.listSales(opts);

    if (exportFmt === 'csv') {
      const rows = list || [];
      const header = ['sales_data_id', 'event_id', 'total_tickets_sold', 'total_revenue', 'last_updated'];
      const csv = [header.join(',')]
        .concat(rows.map((r) => [r.sales_data_id, r.event_id, r.total_tickets_sold, r.total_revenue, r.last_updated].join(',')))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
// Presentation layer: sales and reporting routes

// TODO: implement route registrations
