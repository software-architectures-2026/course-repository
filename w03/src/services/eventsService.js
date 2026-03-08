// Services Layer: Business Logic for Events
const eventsRepository = require('../repositories/eventsRepository');

async function listEvents() {
  // No business logic yet, just pass through
  return await eventsRepository.getAllEvents();
}

module.exports = {
  listEvents,
};
