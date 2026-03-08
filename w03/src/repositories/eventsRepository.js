// Repositories Layer: Data Access for Events
const pool = require('../db');

async function getAllEvents() {
  const result = await pool.query('SELECT * FROM events');
  return result.rows;
}

module.exports = {
  getAllEvents,
};
