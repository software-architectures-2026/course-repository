// Service layer test: test purchaseTicket with mocked repository and payment
const ticketsService = require('../src/services/ticketsService');
const { ConflictError, PaymentFailedError } = require('../src/services/errors');

describe('ticketsService.purchaseTicket', () => {
  it('should succeed when seat is available and payment succeeds', async () => {
    // Mock repository and payment
    const seatsRepository = {
      lockSeat: async () => true,
      releaseSeatLock: async () => {},
      markSeatSold: async () => {},
    };
    const paymentService = {
      processPayment: async () => ({ success: true, transactionId: 'txn_123' }),
    };
    // Inject mocks
    const service = require('../src/services/ticketsService');
    service.__setMocks({ seatsRepository, paymentService });
    const result = await service.purchaseTicket({ eventId: 1, seatId: 1, userId: 1, amount: 100 });
    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('txn_123');
  });

  it('should throw ConflictError if seat is not available', async () => {
    const seatsRepository = {
      lockSeat: async () => false,
      releaseSeatLock: async () => {},
      markSeatSold: async () => {},
    };
    const paymentService = {
      processPayment: async () => ({ success: true, transactionId: 'txn_123' }),
    };
    const service = require('../src/services/ticketsService');
    service.__setMocks({ seatsRepository, paymentService });
    await expect(service.purchaseTicket({ eventId: 1, seatId: 1, userId: 1, amount: 100 }))
      .rejects.toThrow(ConflictError);
  });

  it('should throw PaymentFailedError if payment fails', async () => {
    const seatsRepository = {
      lockSeat: async () => true,
      releaseSeatLock: async () => {},
      markSeatSold: async () => {},
    };
    const paymentService = {
      processPayment: async () => ({ success: false }),
    };
    const service = require('../src/services/ticketsService');
    service.__setMocks({ seatsRepository, paymentService });
    await expect(service.purchaseTicket({ eventId: 1, seatId: 1, userId: 1, amount: 100 }))
      .rejects.toThrow(PaymentFailedError);
  });
});
