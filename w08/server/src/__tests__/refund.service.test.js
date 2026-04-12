jest.mock('../repositories/refund.repository', () => ({
  createRefund: jest.fn(),
  getRefundById: jest.fn(),
  updateRefund: jest.fn(),
  listRefunds: jest.fn(),
}));

jest.mock('../repositories/payment.repository', () => ({
  getPaymentById: jest.fn(),
}));

const refundRepo = require('../repositories/refund.repository');
const paymentRepo = require('../repositories/payment.repository');
const { createRefund, updateRefund } = require('../services/refund.service');

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('refund.service - createRefund', () => {
  test('throws when refund amount is greater than original payment amount', async () => {
    paymentRepo.getPaymentById.mockResolvedValue({ payment_id: 'p1', reservation_id: 'res1', amount: 50 });

    await expect(createRefund({ payment_id: 'p1', reservation_id: 'res1', amount: 60 })).rejects.toThrow(
      'Refund amount cannot exceed original payment amount'
    );
    expect(paymentRepo.getPaymentById).toHaveBeenCalledWith('p1');
    expect(refundRepo.createRefund).not.toHaveBeenCalled();
  });

  test('throws when reservation_id does not match payment.reservation_id', async () => {
    paymentRepo.getPaymentById.mockResolvedValue({ payment_id: 'p1', reservation_id: 'res1', amount: 100 });

    await expect(createRefund({ payment_id: 'p1', reservation_id: 'other', amount: 10 })).rejects.toThrow(
      'Reservation does not match payment'
    );
    expect(paymentRepo.getPaymentById).toHaveBeenCalledWith('p1');
    expect(refundRepo.createRefund).not.toHaveBeenCalled();
  });
});

describe('refund.service - updateRefund', () => {
  test('throws when provided status is invalid', async () => {
    await expect(updateRefund('r1', { status: 'invalid' })).rejects.toThrow('Invalid refund status');
    expect(refundRepo.getRefundById).not.toHaveBeenCalled();
  });

  test("sets processed_at automatically when status becomes 'processed' and processed_at not provided", async () => {
    const existing = { refund_id: 'r1', status: 'pending' };
    refundRepo.getRefundById.mockResolvedValue(existing);
    refundRepo.updateRefund.mockImplementation(async (id, fields) => ({ refund_id: id, ...fields }));

    const MOCK_NOW = Date.parse('2026-04-14T10:00:00.000Z');
    jest.useFakeTimers('modern');
    jest.setSystemTime(MOCK_NOW);

    const res = await updateRefund('r1', { status: 'processed' });

    const expectedProcessedAt = new Date(MOCK_NOW).toISOString();
    expect(refundRepo.updateRefund).toHaveBeenCalledWith('r1', expect.objectContaining({ status: 'processed', processed_at: expectedProcessedAt }));
    expect(res.processed_at).toBe(expectedProcessedAt);
  });

  test('does not override processed_at when already provided', async () => {
    const existing = { refund_id: 'r1', status: 'pending' };
    refundRepo.getRefundById.mockResolvedValue(existing);
    refundRepo.updateRefund.mockImplementation(async (id, fields) => ({ refund_id: id, ...fields }));

    const provided = '2026-04-14T09:30:00.000Z';
    const res = await updateRefund('r1', { status: 'processed', processed_at: provided });

    expect(refundRepo.updateRefund).toHaveBeenCalledWith('r1', expect.objectContaining({ status: 'processed', processed_at: provided }));
    expect(res.processed_at).toBe(provided);
  });
});

/*
+ Notes on Date/testability:
+ - The service sets `processed_at` using `new Date().toISOString()`. That makes tests time-dependent.
+ - In tests above we use `jest.spyOn(Date, 'now').mockReturnValue(...)` to freeze time so `new Date()` produces a deterministic value.
+ - Architectural suggestion: inject a clock/time-provider into the service (e.g. `now()` function or pass `Date`), or export a small helper that returns the current ISO timestamp. This makes production code explicit and easier to unit-test without mocking globals.
*/
