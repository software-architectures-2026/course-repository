// Repository layer test: test lockSeat directly against test DB
const pool = require('../src/db');
const seatsRepository = require('../src/repositories/seatsRepository');

describe('seatsRepository.lockSeat', () => {
  beforeAll(async () => {
    // Setup test data
    await pool.query(`CREATE TABLE IF NOT EXISTS seats (
      event_id INT,
      seat_id INT,
      locked BOOLEAN DEFAULT FALSE,
      sold BOOLEAN DEFAULT FALSE,
      user_id INT
    )`);
    await pool.query('DELETE FROM seats');
    await pool.query('INSERT INTO seats (event_id, seat_id, locked, sold) VALUES (1, 1, FALSE, FALSE)');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM seats');
    await pool.end();
  });

  it('should lock an available seat', async () => {
    const result = await seatsRepository.lockSeat(1, 1);
    expect(result).toBe(true);
  });

  it('should not lock a sold seat', async () => {
    await pool.query('UPDATE seats SET sold = TRUE WHERE event_id = 1 AND seat_id = 1');
    const result = await seatsRepository.lockSeat(1, 1);
    expect(result).toBe(false);
  });
});
