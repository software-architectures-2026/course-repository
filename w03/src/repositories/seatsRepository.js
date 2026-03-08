// Repositories Layer: Data Access for Seats
const pool = require('../db');

/**
 * Atomically lock a seat for purchase. Returns true if locked, false if already taken.
 */
async function lockSeat(eventId, seatId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Try to lock the seat if not already sold
    const res = await client.query(
      `UPDATE seats SET locked = TRUE WHERE event_id = $1 AND seat_id = $2 AND locked = FALSE AND sold = FALSE RETURNING *`,
      [eventId, seatId]
    );
    if (res.rowCount === 1) {
      await client.query('COMMIT');
      return true;
    } else {
      await client.query('ROLLBACK');
      return false;
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Release a seat lock (compensation for failed payment)
 */
async function releaseSeatLock(eventId, seatId) {
  await pool.query(
    `UPDATE seats SET locked = FALSE WHERE event_id = $1 AND seat_id = $2 AND sold = FALSE`,
    [eventId, seatId]
  );
}

/**
 * Mark seat as sold (after successful payment)
 */
async function markSeatSold(eventId, seatId, userId) {
  await pool.query(
    `UPDATE seats SET sold = TRUE, locked = FALSE, user_id = $3 WHERE event_id = $1 AND seat_id = $2`,
    [eventId, seatId, userId]
  );
}

module.exports = {
  lockSeat,
  releaseSeatLock,
  markSeatSold,
};
