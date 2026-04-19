jest.mock('../repositories/reservation.repository', () => ({
  createReservation: jest.fn(),
  getReservationById: jest.fn(),
  updateReservation: jest.fn(),
  deleteReservation: jest.fn(),
  listReservations: jest.fn(),
  findActiveByEventSeat: jest.fn(),
}));

jest.mock('../repositories/user.repository', () => ({
  getUserById: jest.fn(),
}));

jest.mock('../repositories/ticketType.repository', () => ({
  getTicketTypeById: jest.fn(),
}));

const reservationRepo = require('../repositories/reservation.repository');
const userRepo = require('../repositories/user.repository');
const ticketTypeRepo = require('../repositories/ticketType.repository');
const { createReservation } = require('../services/reservation.service');
const { NotFoundError, ConflictError, ValidationError } = require('../errors');

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('reservation.service - createReservation', () => {
  test('creates reservation successfully with default expiry when expires_at not provided', async () => {
    const input = { event_id: 'evt1', user_id: 'u1', ticket_type_id: 'tt1', seat: 'A1', metadata: { foo: 'bar' } };
    const tt = { ticket_type_id: 'tt1', event_id: 'evt1', quantity: 10 };

    ticketTypeRepo.getTicketTypeById.mockResolvedValue(tt);
    userRepo.getUserById.mockResolvedValue({ user_id: 'u1' });
    reservationRepo.findActiveByEventSeat.mockResolvedValue(null);

    const MOCK_NOW = Date.parse('2026-04-14T09:00:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);

    reservationRepo.createReservation.mockImplementation(async (payload) => ({ reservation_id: 'r1', ...payload }));

    const expectedExpiry = new Date(MOCK_NOW + 60 * 60 * 1000).toISOString();

    const res = await createReservation(input);

    expect(ticketTypeRepo.getTicketTypeById).toHaveBeenCalledWith('tt1');
    expect(userRepo.getUserById).toHaveBeenCalledWith('u1');
    expect(reservationRepo.findActiveByEventSeat).toHaveBeenCalledWith('evt1', 'A1');
    expect(reservationRepo.createReservation).toHaveBeenCalledWith({
      event_id: 'evt1',
      user_id: 'u1',
      ticket_type_id: 'tt1',
      seat: 'A1',
      status: 'active',
      expires_at: expectedExpiry,
      metadata: { foo: 'bar' },
    });

    expect(res).toEqual({
      reservation_id: 'r1',
      event_id: 'evt1',
      user_id: 'u1',
      ticket_type_id: 'tt1',
      seat: 'A1',
      status: 'active',
      expires_at: expectedExpiry,
      metadata: { foo: 'bar' },
    });
  });

  test('throws ValidationError when required fields are missing', async () => {
    await expect(createReservation({})).rejects.toBeInstanceOf(ValidationError);
    expect(reservationRepo.createReservation).not.toHaveBeenCalled();
  });

  test('throws NotFoundError when ticket type not found', async () => {
    ticketTypeRepo.getTicketTypeById.mockResolvedValue(null);
    await expect(createReservation({ event_id: 'evt1', ticket_type_id: 'missing' })).rejects.toBeInstanceOf(NotFoundError);
    expect(reservationRepo.createReservation).not.toHaveBeenCalled();
  });

  test('throws ConflictError when seat already reserved', async () => {
    ticketTypeRepo.getTicketTypeById.mockResolvedValue({ ticket_type_id: 'tt1', event_id: 'evt1' });
    reservationRepo.findActiveByEventSeat.mockResolvedValue({ reservation_id: 'existing' });

    await expect(createReservation({ event_id: 'evt1', ticket_type_id: 'tt1', seat: 'A1' })).rejects.toBeInstanceOf(ConflictError);
    expect(reservationRepo.createReservation).not.toHaveBeenCalled();
  });
});
