const db = require('../config/db');
const salesRepo = require('../repositories/sales.repository');

async function recomputeSalesForEvent(event_id) {
  if (!event_id) {
    const err = new Error('event_id is required');
    err.status = 400;
    throw err;
  }

  // total tickets sold: count of issued tickets for the event
  const ticketsRes = await db.query(
    `SELECT COUNT(t.ticket_id) AS tickets_sold
     FROM tickets t
     JOIN ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
     WHERE tt.event_id = $1 AND t.status = 'issued'`,
    [event_id]
  );
  const ticketsSold = Number(ticketsRes.rows[0] ? ticketsRes.rows[0].tickets_sold : 0) || 0;

  // total revenue: sum of completed payments for reservations belonging to the event
  const revenueRes = await db.query(
    `SELECT COALESCE(SUM(p.amount),0) AS revenue
     FROM payments p
     JOIN ticket_reservations r ON p.reservation_id = r.reservation_id
     WHERE r.event_id = $1 AND p.status = 'completed'`,
    [event_id]
  );
  const totalRevenue = Number(revenueRes.rows[0] ? revenueRes.rows[0].revenue : 0) || 0;

  const updated = await salesRepo.upsertSalesByEvent({ event_id, total_tickets_sold: ticketsSold, total_revenue: totalRevenue, metadata: {} });
  return updated;
}

async function getSalesForEvent(event_id) {
  if (!event_id) {
    const err = new Error('event_id is required');
    err.status = 400;
    throw err;
  }
  const sd = await salesRepo.getSalesByEvent(event_id);
  if (sd) return sd;
  // If no cached sales data, compute on-demand
  return recomputeSalesForEvent(event_id);
}

async function triggerRecompute(event_id) {
  if (!event_id) {
    const err = new Error('event_id is required');
    err.status = 400;
    throw err;
  }
  // Fire-and-forget recompute so caller gets quick response
  setImmediate(() => {
    recomputeSalesForEvent(event_id).catch((e) => console.error('Sales recompute failed:', e && e.message));
  });
  return { accepted: true };
}

async function listSales(opts = {}) {
  return salesRepo.listSales(opts);
}

module.exports = {
  recomputeSalesForEvent,
  getSalesForEvent,
  triggerRecompute,
  listSales,
};
// Business logic layer: sales service (aggregate sales, export)

// TODO: implement service methods
