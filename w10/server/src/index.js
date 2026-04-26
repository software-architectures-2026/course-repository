const express = require('express');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
// Simple CORS middleware for development (allow dev client at localhost:4200)
app.use((req, res, next) => {
	const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:4200';
	res.header('Access-Control-Allow-Origin', allowedOrigin);
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	if (req.method === 'OPTIONS') return res.sendStatus(200);
	next();
});
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
// Central error handler (moved to middleware)
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

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
