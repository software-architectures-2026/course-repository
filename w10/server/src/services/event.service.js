const eventRepo = require('../repositories/event.repository');
const userRepo = require('../repositories/user.repository');
const { ValidationError, NotFoundError, AuthorizationError } = require('../errors');

async function createEvent({ organizer_id, title, description, category, location, start_time, end_time, visibility = false, published = false, metadata = {} }) {
	const missing = [];
	if (!organizer_id) missing.push('organizer_id');
	if (!title) missing.push('title');
	if (!location) missing.push('location');
	if (!start_time) missing.push('start_time');
	if (!end_time) missing.push('end_time');
	if (missing.length) {
		throw new ValidationError('Missing required event fields', {
			code: 'MISSING_EVENT_FIELDS',
			details: missing.map((f) => ({ field: f, issue: 'required' })),
		});
	}

	if (new Date(start_time) >= new Date(end_time)) {
		throw new ValidationError('start_time must be before end_time', {
			code: 'INVALID_EVENT_DATES',
			details: [{ field: 'start_time', issue: 'must be before end_time' }],
		});
	}

	// ensure organizer exists
	const organizer = await userRepo.getUserById(organizer_id);
	if (!organizer) {
		throw new NotFoundError('Organizer not found', { code: 'ORGANIZER_NOT_FOUND' });
	}

	const created = await eventRepo.createEvent({ organizer_id, title, description, category, location, start_time, end_time, visibility, published, metadata });
	return created;
}

async function getEvent(event_id) {
	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		throw new NotFoundError('Event not found', { code: 'EVENT_NOT_FOUND' });
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
		throw new NotFoundError('Event not found', { code: 'EVENT_NOT_FOUND' });
	}
	// only organizer (owner) can modify in this simple implementation
	if (actor_id && ev.organizer_id !== actor_id) {
		throw new AuthorizationError('Only the organizer can modify this event', { code: 'NOT_EVENT_OWNER' });
	}
	if (fields.start_time && fields.end_time && new Date(fields.start_time) >= new Date(fields.end_time)) {
		throw new ValidationError('start_time must be before end_time', {
			code: 'INVALID_EVENT_DATES',
			details: [{ field: 'start_time', issue: 'must be before end_time' }],
		});
	}
	const updated = await eventRepo.updateEvent(event_id, fields);
	if (!updated) {
		throw new NotFoundError('Event not found', { code: 'EVENT_NOT_FOUND' });
	}
	return updated;
}

async function deleteEvent(event_id, actor_id, { hard = false } = {}) {
	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		throw new NotFoundError('Event not found', { code: 'EVENT_NOT_FOUND' });
	}
	if (actor_id && ev.organizer_id !== actor_id) {
		throw new AuthorizationError('Only the organizer can delete this event', { code: 'NOT_EVENT_OWNER' });
	}
	const res = await eventRepo.deleteEvent(event_id, { hard });
	return res;
}

async function publishEvent(event_id, actor_id, published) {
	const ev = await eventRepo.getEventById(event_id);
	if (!ev) {
		throw new NotFoundError('Event not found', { code: 'EVENT_NOT_FOUND' });
	}
	if (actor_id && ev.organizer_id !== actor_id) {
		throw new AuthorizationError('Only the organizer can change publish status', { code: 'NOT_EVENT_OWNER' });
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
