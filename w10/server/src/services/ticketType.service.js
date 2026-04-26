const ticketTypeRepo = require('../repositories/ticketType.repository');
const eventRepo = require('../repositories/event.repository');

async function createTicketType({ event_id, name, price, quantity, metadata = {} }) {
	if (!event_id || !name || typeof price === 'undefined' || typeof quantity === 'undefined') {
		const err = new Error('event_id, name, price and quantity are required');
		err.status = 400;
		throw err;
	}
	if (Number(price) < 0) {
		const err = new Error('price must be non-negative');
		err.status = 400;
		throw err;
	}
	if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
		const err = new Error('quantity must be a non-negative integer');
		err.status = 400;
		throw err;
	}

	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}

	const created = await ticketTypeRepo.createTicketType({ event_id, name, price, quantity, metadata });
	return created;
}

async function getTicketType(ticket_type_id) {
	const tt = await ticketTypeRepo.getTicketTypeById(ticket_type_id);
	if (!tt) {
		const err = new Error('Ticket type not found');
		err.status = 404;
		throw err;
	}
	return tt;
}

async function listTicketTypesByEvent(event_id) {
	return ticketTypeRepo.listTicketTypesByEvent(event_id);
}

async function listTicketTypes(opts = {}) {
	return ticketTypeRepo.listTicketTypes(opts);
}

async function updateTicketType(ticket_type_id, actor_id, fields = {}) {
	const existing = await ticketTypeRepo.getTicketTypeById(ticket_type_id);
	if (!existing) {
		const err = new Error('Ticket type not found');
		err.status = 404;
		throw err;
	}

	// simple ownership check: only event organizer can update ticket types
	const ev = await eventRepo.getEventById(existing.event_id);
	if (!ev) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}
	if (actor_id && ev.organizer_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
	}

	if (fields.price !== undefined && Number(fields.price) < 0) {
		const err = new Error('price must be non-negative');
		err.status = 400;
		throw err;
	}
	if (fields.quantity !== undefined && (!Number.isInteger(Number(fields.quantity)) || Number(fields.quantity) < 0)) {
		const err = new Error('quantity must be a non-negative integer');
		err.status = 400;
		throw err;
	}

	const updated = await ticketTypeRepo.updateTicketType(ticket_type_id, fields);
	return updated;
}

async function deleteTicketType(ticket_type_id, actor_id, { hard = false } = {}) {
	const existing = await ticketTypeRepo.getTicketTypeById(ticket_type_id);
	if (!existing) {
		const err = new Error('Ticket type not found');
		err.status = 404;
		throw err;
	}
	const ev = await eventRepo.getEventById(existing.event_id);
	if (!ev) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}
	if (actor_id && ev.organizer_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
	}
	const res = await ticketTypeRepo.deleteTicketType(ticket_type_id, { hard });
	return res;
}

module.exports = {
	createTicketType,
	getTicketType,
	listTicketTypesByEvent,
	listTicketTypes,
	updateTicketType,
	deleteTicketType,
};
