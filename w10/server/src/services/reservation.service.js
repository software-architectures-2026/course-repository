const reservationRepo = require('../repositories/reservation.repository');
const userRepo = require('../repositories/user.repository');
const ticketTypeRepo = require('../repositories/ticketType.repository');
const { ValidationError, NotFoundError, AuthorizationError, ConflictError } = require('../errors');

async function createReservation({ event_id, user_id, ticket_type_id, seat = null, expires_at = null, metadata = {} }) {
	const missing = [];
	if (!event_id) missing.push('event_id');
	if (!ticket_type_id) missing.push('ticket_type_id');
	if (missing.length) {
		throw new ValidationError('Missing required reservation fields', {
			code: 'MISSING_RESERVATION_FIELDS',
			details: missing.map((f) => ({ field: f, issue: 'required' })),
		});
	}

	// verify ticket type exists and belongs to event
	const tt = await ticketTypeRepo.getTicketTypeById(ticket_type_id);
	if (!tt) {
		throw new NotFoundError('Ticket type not found', { code: 'TICKET_TYPE_NOT_FOUND' });
	}
	if (tt.event_id !== event_id) {
		throw new ValidationError('Ticket type does not belong to event', { code: 'TICKET_TYPE_EVENT_MISMATCH' });
	}

	// verify user exists if provided
	if (user_id) {
		const user = await userRepo.getUserById(user_id);
		if (!user) {
			throw new NotFoundError('User not found', { code: 'USER_NOT_FOUND' });
		}
	}

	// enforce unique active seat for event
	if (seat) {
		const existing = await reservationRepo.findActiveByEventSeat(event_id, seat);
		if (existing) {
			throw new ConflictError('Seat already reserved', { code: 'SEAT_ALREADY_RESERVED' });
		}
	}

	// default expiry: 1 hour from now if not provided
	const expiry = expires_at || new Date(Date.now() + 60 * 60 * 1000).toISOString();

	const created = await reservationRepo.createReservation({ event_id, user_id, ticket_type_id, seat, status: 'active', expires_at: expiry, metadata });
	return created;
}

async function getReservation(reservation_id) {
	const r = await reservationRepo.getReservationById(reservation_id);
	if (!r) {
		throw new NotFoundError('Reservation not found', { code: 'RESERVATION_NOT_FOUND' });
	}
	return r;
}

async function listReservations(opts = {}) {
	return reservationRepo.listReservations(opts);
}

async function updateReservation(reservation_id, actor_id, fields = {}) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		throw new NotFoundError('Reservation not found', { code: 'RESERVATION_NOT_FOUND' });
	}

	// only reservation owner can update (simple policy)
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		throw new AuthorizationError('Only the reservation owner can update this reservation', { code: 'NOT_RESERVATION_OWNER' });
	}

	if (fields.seat && fields.seat !== existing.seat) {
		const taken = await reservationRepo.findActiveByEventSeat(existing.event_id, fields.seat);
		if (taken) {
			throw new ConflictError('Seat already reserved', { code: 'SEAT_ALREADY_RESERVED' });
		}
	}

	const updated = await reservationRepo.updateReservation(reservation_id, fields);
	return updated;
}

async function deleteReservation(reservation_id, actor_id, { hard = false } = {}) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		throw new NotFoundError('Reservation not found', { code: 'RESERVATION_NOT_FOUND' });
	}
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		throw new AuthorizationError('Only the reservation owner can delete this reservation', { code: 'NOT_RESERVATION_OWNER' });
	}
	const res = await reservationRepo.deleteReservation(reservation_id, { hard });
	return res;
}

async function cancelReservation(reservation_id, actor_id) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		throw new NotFoundError('Reservation not found', { code: 'RESERVATION_NOT_FOUND' });
	}
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		throw new AuthorizationError('Only the reservation owner can cancel this reservation', { code: 'NOT_RESERVATION_OWNER' });
	}
	const updated = await reservationRepo.updateReservation(reservation_id, { status: 'cancelled' });
	return updated;
}

module.exports = {
	createReservation,
	getReservation,
	listReservations,
	updateReservation,
	deleteReservation,
	cancelReservation,
};
