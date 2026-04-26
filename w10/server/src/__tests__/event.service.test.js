jest.mock('../repositories/event.repository', () => ({
  createEvent: jest.fn(),
  getEventById: jest.fn(),
  listEvents: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  setPublishStatus: jest.fn(),
  listUnpublished: jest.fn(),
}));

jest.mock('../repositories/user.repository', () => ({
  getUserById: jest.fn(),
}));

const eventRepo = require('../repositories/event.repository');
const userRepo = require('../repositories/user.repository');
const { createEvent, getEvent, updateEvent } = require('../services/event.service');
const { ValidationError, NotFoundError, AuthorizationError } = require('../errors');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('event.service - createEvent', () => {
  test('creates event successfully with valid input and existing organizer', async () => {
    const input = {
      organizer_id: 'org1',
      title: 'My Event',
      description: 'desc',
      category: 'conf',
      location: 'Main Hall',
      start_time: '2026-04-14T10:00:00.000Z',
      end_time: '2026-04-14T11:00:00.000Z',
      visibility: true,
      published: false,
      metadata: { foo: 'bar' },
    };

    userRepo.getUserById.mockResolvedValue({ user_id: 'org1' });
    const created = { event_id: 'e1', ...input };
    eventRepo.createEvent.mockResolvedValue(created);

    const res = await createEvent(input);

    expect(userRepo.getUserById).toHaveBeenCalledWith('org1');
    expect(eventRepo.createEvent).toHaveBeenCalledWith({
      organizer_id: 'org1',
      title: 'My Event',
      description: 'desc',
      category: 'conf',
      location: 'Main Hall',
      start_time: '2026-04-14T10:00:00.000Z',
      end_time: '2026-04-14T11:00:00.000Z',
      visibility: true,
      published: false,
      metadata: { foo: 'bar' },
    });
    expect(res).toBe(created);
  });

  test('throws ValidationError when required fields are missing', async () => {
    await expect(createEvent({})).rejects.toBeInstanceOf(ValidationError);
    expect(eventRepo.createEvent).not.toHaveBeenCalled();
  });

  test('throws ValidationError when start_time is not before end_time', async () => {
    const input = {
      organizer_id: 'org1',
      title: 'Bad Dates',
      location: 'Somewhere',
      start_time: '2026-04-14T11:00:00.000Z',
      end_time: '2026-04-14T11:00:00.000Z',
    };

    await expect(createEvent(input)).rejects.toBeInstanceOf(ValidationError);
    expect(userRepo.getUserById).not.toHaveBeenCalled();
    expect(eventRepo.createEvent).not.toHaveBeenCalled();
  });

  test('throws NotFoundError when organizer does not exist', async () => {
    const input = {
      organizer_id: 'missing-org',
      title: 'Title',
      location: 'Loc',
      start_time: '2026-04-14T10:00:00.000Z',
      end_time: '2026-04-14T11:00:00.000Z',
    };

    userRepo.getUserById.mockResolvedValue(null);

    await expect(createEvent(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(eventRepo.createEvent).not.toHaveBeenCalled();
  });
});

describe('event.service - getEvent', () => {
  test('returns event when found', async () => {
    const ev = { event_id: 'e1', title: 'Found' };
    eventRepo.getEventById.mockResolvedValue(ev);

    await expect(getEvent('e1')).resolves.toBe(ev);
    expect(eventRepo.getEventById).toHaveBeenCalledWith('e1');
  });

  test("throws NotFoundError when event doesn't exist", async () => {
    eventRepo.getEventById.mockResolvedValue(null);
    await expect(getEvent('nope')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('event.service - updateEvent', () => {
  test('throws AuthorizationError when actor is not the organizer', async () => {
    const existing = { event_id: 'e1', organizer_id: 'owner123' };
    eventRepo.getEventById.mockResolvedValue(existing);

    await expect(updateEvent('e1', 'someone-else', {})).rejects.toBeInstanceOf(AuthorizationError);
    expect(eventRepo.updateEvent).not.toHaveBeenCalled();
  });
});
