const db = require('../config/db');

async function getSalesById(sales_data_id) {
  const sql = `
    SELECT sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at
    FROM sales_data WHERE sales_data_id = $1
  `;
  const res = await db.query(sql, [sales_data_id]);
  return res.rows[0] || null;
}

async function getSalesByEvent(event_id) {
  const sql = `
    SELECT sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at
    FROM sales_data WHERE event_id = $1
  `;
  const res = await db.query(sql, [event_id]);
  return res.rows[0] || null;
}

async function upsertSalesByEvent({ event_id, total_tickets_sold = 0, total_revenue = 0, metadata = {} }) {
  // Try update first, if no row updated insert a new one
  const sql = `
    WITH upd AS (
      UPDATE sales_data
      SET total_tickets_sold = $2,
          total_revenue = $3,
          last_updated = NOW(),
          metadata = $4,
          updated_at = NOW()
      WHERE event_id = $1
      RETURNING *
    )
    INSERT INTO sales_data (sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata)
    SELECT gen_random_uuid(), $1, $2, $3, NOW(), $4
    WHERE NOT EXISTS (SELECT 1 FROM upd)
    RETURNING sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at
  `;
  const params = [event_id, total_tickets_sold, total_revenue, metadata];
  const res = await db.query(sql, params);
  // If insert returned a row it'll be in res.rows[0], otherwise fetch the updated row
  if (res.rows.length > 0) return res.rows[0];
  return getSalesByEvent(event_id);
}

async function incrementSales(event_id, ticketsDelta = 0, revenueDelta = 0) {
  const sql = `
    UPDATE sales_data
    SET total_tickets_sold = total_tickets_sold + $2,
        total_revenue = total_revenue + $3,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE event_id = $1
    RETURNING sales_data_id, event_id, total_tickets_sold, total_revenue, last_updated, metadata, created_at, updated_at
  `;
  const res = await db.query(sql, [event_id, ticketsDelta, revenueDelta]);
  if (res.rows.length > 0) return res.rows[0];
  // No existing row: create one with the deltas
  return upsertSalesByEvent({ event_id, total_tickets_sold: ticketsDelta, total_revenue: revenueDelta, metadata: {} });
}

async function listSales({ start = null, end = null, organizer_id = null, page = 1, limit = 50 } = {}) {
  const where = [];
  const params = [];
  let idx = 1;

  if (start) {
    where.push(`sd.last_updated >= $${idx}`);
    params.push(start);
    idx++;
  }
  if (end) {
    where.push(`sd.last_updated <= $${idx}`);
    params.push(end);
    idx++;
  }
  if (organizer_id) {
    where.push(`e.organizer_id = $${idx}`);
    params.push(organizer_id);
    idx++;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (Math.max(page, 1) - 1) * limit;

  const sql = `
    SELECT sd.sales_data_id, sd.event_id, sd.total_tickets_sold, sd.total_revenue, sd.last_updated, sd.metadata, sd.created_at, sd.updated_at
    FROM sales_data sd
    JOIN events e ON sd.event_id = e.event_id
    ${whereSql}
    ORDER BY sd.total_revenue DESC, sd.last_updated DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  params.push(limit, offset);
  const res = await db.query(sql, params);
  return res.rows;
}

module.exports = {
  getSalesById,
  getSalesByEvent,
  upsertSalesByEvent,
  incrementSales,
  listSales,
};
