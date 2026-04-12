const db = require('../config/db');
const ticketRepo = require('../repositories/ticket.repository');
const reservationRepo = require('../repositories/reservation.repository');
const { ValidationError, NotFoundError, ConflictError, BusinessRuleError, AppError, InternalError } = require('../errors');

async function issueTicketForReservation(reservation_id) {
	if (!reservation_id) {
		throw new ValidationError('reservation_id is required', {
			code: 'MISSING_RESERVATION_ID',
			details: [{ field: 'reservation_id', issue: 'required' }],
		});
	}

	const reservation = await reservationRepo.getReservationById(reservation_id);
	if (!reservation) {
		throw new NotFoundError('Reservation not found', { code: 'RESERVATION_NOT_FOUND' });
	}

	// If ticket(s) already issued for this reservation, return them
	const existingTickets = await ticketRepo.listTicketsByReservation(reservation_id);
	if (existingTickets && existingTickets.length > 0) {
		return existingTickets[0];
	}

	// Ensure payment completed for reservation
	const p = await db.query("SELECT payment_id, status FROM payments WHERE reservation_id = $1 ORDER BY created_at DESC LIMIT 1", [reservation_id]);
	const payment = p.rows[0];
	if (!payment || payment.status !== 'completed') {
		throw new BusinessRuleError('Payment not completed for reservation', { code: 'PAYMENT_REQUIRED', details: [{ field: 'reservation_id', issue: 'payment_incomplete' }] });
	}

	// Issue one ticket for the reservation
	const client = await db.pool.connect();
	try {
		await client.query('BEGIN');
		// decrement ticket_types.quantity to avoid oversell
		const dec = await client.query(
			`UPDATE ticket_types SET quantity = quantity - 1, updated_at = NOW() WHERE ticket_type_id = $1 AND quantity > 0 RETURNING quantity`,
			[reservation.ticket_type_id]
		);
		if (dec.rowCount === 0) {
			await client.query('ROLLBACK');
			throw new ConflictError('Ticket type sold out', { code: 'TICKET_TYPE_SOLD_OUT', details: [{ field: 'ticket_type_id', value: reservation.ticket_type_id }] });
		}

		const issued_at = new Date().toISOString();
		const ticket = await client.query(
			`INSERT INTO tickets (ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ticket_id, ticket_type_id, reservation_id, user_id, seat, status, issued_at, metadata, created_at, updated_at`,
			[reservation.ticket_type_id, reservation.reservation_id, reservation.user_id, reservation.seat, 'issued', issued_at, {}]
		);

		await client.query('COMMIT');
		return ticket.rows[0];
	} catch (err) {
		try { await client.query('ROLLBACK'); } catch (e) {}
		// Re-throw known AppError subclasses as-is so caller/middleware can handle them
		if (err instanceof AppError) throw err;
		// Unexpected error inside transaction -> wrap as InternalError to avoid leaking details
		throw new InternalError('Failed to issue ticket due to internal error');
	} finally {
		client.release();
	}
}

async function getTicket(ticket_id) {
	const t = await ticketRepo.getTicketById(ticket_id);
	if (!t) {
		const err = new Error('Ticket not found');
		err.status = 404;
		throw err;
	}
	return t;
}

async function listTickets(opts = {}) {
	return ticketRepo.listTickets(opts);
}

async function listTicketsByUser(user_id) {
	return ticketRepo.listTicketsByUser(user_id);
}

module.exports = {
	issueTicketForReservation,
	getTicket,
	listTickets,
	listTicketsByUser,
};
