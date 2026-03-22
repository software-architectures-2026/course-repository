const db = require('../config/db');
const reservationRepo = require('../repositories/reservation.repository');
const userRepo = require('../repositories/user.repository');

async function createReservation({ event_id, user_id, ticket_type_id, seat = null, expires_at = null, metadata = {} }) {
	if (!event_id || !ticket_type_id) {
		const err = new Error('event_id and ticket_type_id are required');
		err.status = 400;
		throw err;
	}

	// verify ticket type exists and belongs to event
	const tt = await db.query('SELECT ticket_type_id, event_id, quantity FROM ticket_types WHERE ticket_type_id = $1', [ticket_type_id]);
	if (!tt.rows[0]) {
		const err = new Error('Ticket type not found');
		err.status = 404;
		throw err;
	}
	if (tt.rows[0].event_id !== event_id) {
		const err = new Error('Ticket type does not belong to event');
		err.status = 400;
		throw err;
	}

	// verify user exists if provided
	if (user_id) {
		const user = await userRepo.getUserById(user_id);
		if (!user) {
			const err = new Error('User not found');
			err.status = 404;
			throw err;
		}
	}

	// enforce unique active seat for event
	if (seat) {
		const existing = await reservationRepo.findActiveByEventSeat(event_id, seat);
		if (existing) {
			const err = new Error('Seat already reserved');
			err.status = 409;
			throw err;
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
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
	}
	return r;
}

async function listReservations(opts = {}) {
	return reservationRepo.listReservations(opts);
}

async function updateReservation(reservation_id, actor_id, fields = {}) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
	}

	// only reservation owner can update (simple policy)
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
	}

	if (fields.seat && fields.seat !== existing.seat) {
		const taken = await reservationRepo.findActiveByEventSeat(existing.event_id, fields.seat);
		if (taken) {
			const err = new Error('Seat already reserved');
			err.status = 409;
			throw err;
		}
	}

	const updated = await reservationRepo.updateReservation(reservation_id, fields);
	return updated;
}

async function deleteReservation(reservation_id, actor_id, { hard = false } = {}) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
	}
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
	}
	const res = await reservationRepo.deleteReservation(reservation_id, { hard });
	return res;
}

async function cancelReservation(reservation_id, actor_id) {
	const existing = await reservationRepo.getReservationById(reservation_id);
	if (!existing) {
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
	}
	if (actor_id && existing.user_id && existing.user_id !== actor_id) {
		const err = new Error('Forbidden');
		err.status = 403;
		throw err;
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
