const db = require('../config/db');
const ticketRepo = require('../repositories/ticket.repository');
const reservationRepo = require('../repositories/reservation.repository');

async function issueTicketForReservation(reservation_id) {
	if (!reservation_id) {
		const err = new Error('reservation_id is required');
		err.status = 400;
		throw err;
	}

	const reservation = await reservationRepo.getReservationById(reservation_id);
	if (!reservation) {
		const err = new Error('Reservation not found');
		err.status = 404;
		throw err;
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
		const err = new Error('Payment not completed for reservation');
		err.status = 402; // Payment Required
		throw err;
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
			const err = new Error('Ticket type sold out');
			err.status = 409;
			throw err;
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
		throw err;
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
