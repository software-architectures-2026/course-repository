const eventRepo = require('../repositories/event.repository');
const userRepo = require('../repositories/user.repository');

async function createEvent({ organizer_id, title, description, category, location, start_time, end_time, visibility = false, published = false, metadata = {} }) {
	if (!organizer_id || !title || !location || !start_time || !end_time) {
		const err = new Error('Missing required event fields');
		err.status = 400;
		throw err;
	}
	if (new Date(start_time) >= new Date(end_time)) {
		const err = new Error('start_time must be before end_time');
		err.status = 400;
		throw err;
	}
	// ensure organizer exists
	const organizer = await userRepo.getUserById(organizer_id);
	if (!organizer) {
		const err = new Error('Organizer not found');
		err.status = 404;
		throw err;
	}
	const created = await eventRepo.createEvent({ organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata });
	return created;
}

async function getEvent(event_id) {
	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}
	return ev;
}

async function listEvents(opts = {}) {
	// By default, only show published events to public callers
	if (typeof opts.published === 'undefined') {
		opts.published = true;
	}
	return eventRepo.listEvents(opts);
}

async function updateEvent(event_id, actor_id, fields = {}) {
	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}
	// only organizer (owner) can modify in this simple implementation
	if (actor_id && ev.organizer_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
	}
	if (fields.start_time && fields.end_time && new Date(fields.start_time) >= new Date(fields.end_time)) {
		const err = new Error('start_time must be before end_time');
		err.status = 400;
		throw err;
	}
	const updated = await eventRepo.updateEvent(event_id, fields);
	if (!updated) {
		const err = new Error('Event not found');
		err.status = 404;
		throw err;
	}
	return updated;
}

async function deleteEvent(event_id, actor_id, { hard = false } = {}) {
	const ev = await eventRepo.getEventById(event_id);
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
	const res = await eventRepo.deleteEvent(event_id, { hard });
	return res;
}

async function publishEvent(event_id, actor_id, published) {
	const ev = await eventRepo.getEventById(event_id);
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
	const updated = await eventRepo.setPublishStatus(event_id, published);
	return updated;
}

async function listUnpublished() {
	return eventRepo.listUnpublished();
}

module.exports = {
	createEvent,
	getEvent,
	listEvents,
	updateEvent,
	deleteEvent,
	publishEvent,
	listUnpublished,
};
