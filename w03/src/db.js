// Shared database connection (PostgreSQL)
const { Pool } = require('pg');

const pool = new Pool({
  // TODO: Replace with your actual database config
  user: process.env.PGUSER || 'eventhub',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'eventhub',
  password: process.env.PGPASSWORD || 'password',
  port: process.env.PGPORT || 5432,
});

module.exports = pool;
