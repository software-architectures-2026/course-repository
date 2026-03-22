const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://eventhub_user:eventhub_pass@localhost:5432/eventhub';

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
	console.error('Unexpected error on idle PostgreSQL client', err);
	// depending on policy, you might want to exit
});

module.exports = {
	query: (text, params) => pool.query(text, params),
	pool,
};
