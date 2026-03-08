// Services Layer: Business Logic for Ticket Purchasing
const seatsRepository = require('../repositories/seatsRepository');
const paymentService = require('./paymentService');
const { ConflictError, PaymentFailedError } = require('./errors');

async function purchaseTicket({ eventId, seatId, userId, amount }) {
  // 1. Atomically lock the seat
  const locked = await seatsRepository.lockSeat(eventId, seatId);
  if (!locked) {
    throw new ConflictError('Seat is already sold or locked');
  }
  // 2. Process payment
  const paymentResult = await paymentService.processPayment({ eventId, seatId, userId, amount });
  if (!paymentResult.success) {
    // 3. Release seat lock if payment fails
    await seatsRepository.releaseSeatLock(eventId, seatId);
    throw new PaymentFailedError('Payment failed');
  }
  // 4. Mark seat as sold
  await seatsRepository.markSeatSold(eventId, seatId, userId);
  return {
    success: true,
    transactionId: paymentResult.transactionId,
  };
}

module.exports = {
  purchaseTicket,
};
