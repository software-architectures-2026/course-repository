const express = require('express');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
// Parse JWT if present and attach user to requests
const authMiddleware = require('./middlewares/auth.middleware');
app.use(authMiddleware.authenticateOptional);

const db = require('./config/db');

// Basic health endpoints
app.get('/', (req, res) => res.json({ status: 'ok', api: '/api' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routers
const authRouter = require('./routes/auth.routes');
app.use('/api', authRouter);
const usersRouter = require('./routes/users.routes');
app.use('/api', usersRouter);
const eventsRouter = require('./routes/events.routes');
app.use('/api', eventsRouter);
const paymentsRouter = require('./routes/payments.routes');
app.use('/api', paymentsRouter);
const refundsRouter = require('./routes/refunds.routes');
app.use('/api', refundsRouter);
const reservationsRouter = require('./routes/reservations.routes');
app.use('/api', reservationsRouter);
const ticketsRouter = require('./routes/tickets.routes');
app.use('/api', ticketsRouter);
const salesRouter = require('./routes/sales.routes');
app.use('/api', salesRouter);
const ticketTypesRouter = require('./routes/ticketTypes.routes');
app.use('/api', ticketTypesRouter);

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
