const express = require('express');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

const db = require('./config/db');

// Basic health endpoints
app.get('/', (req, res) => res.json({ status: 'ok', api: '/api' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routers
const usersRouter = require('./routes/users.routes');
app.use('/api', usersRouter);

// Central error handler
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Test DB connection once at startup
db.query('SELECT 1')
	.then(() => console.log('Connected to PostgreSQL'))
	.catch((err) => console.error('PostgreSQL connection test failed:', err.message || err));

const server = app.listen(PORT, () => {
	console.log(`EventHub server listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
	console.log(`Received ${signal}, shutting down...`);
	server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
