// Route layer test: test POST /api/tickets/purchase with mocked service
const express = require('express');
const request = require('supertest');

jest.mock('../src/services/ticketsService', () => ({
  purchaseTicket: jest.fn(async ({ eventId, seatId, userId, amount }) => {
    if (seatId === 1) return { success: true, transactionId: 'txn_123' };
    throw new (require('../src/services/errors').ConflictError)('Seat is already sold or locked');
  }),
}));

const ticketsRoute = require('../src/routes/tickets');

const app = express();
app.use(express.json());
app.use('/api/tickets', ticketsRoute);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/tickets/purchase', () => {
  it('should return 201 and transactionId for available seat', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ eventId: 1, seatId: 1, userId: 1, amount: 100 });
    expect(res.status).toBe(201);
    expect(res.body.transactionId).toBe('txn_123');
  });

  it('should return 409 for sold seat', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ eventId: 1, seatId: 2, userId: 1, amount: 100 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Seat is already sold or locked');
  });
});
