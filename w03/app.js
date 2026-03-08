// Express app entry point
const express = require('express');
const app = express();



// Import events and tickets routes
const eventsRoute = require('./src/routes/events');
const ticketsRoute = require('./src/routes/tickets');

// Middleware setup (add as needed)
app.use(express.json());



// Mount routes
app.use('/api/events', eventsRoute);
app.use('/api/tickets', ticketsRoute);

// Centralized error handler (must be last)
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EventHub backend running on port ${PORT}`);
});

module.exports = app;
