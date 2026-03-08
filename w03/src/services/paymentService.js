// Mock Payment Service
// Simulates payment success/failure

async function processPayment({ eventId, seatId, userId, amount }) {
  // Simulate random success/failure
  const success = Math.random() > 0.2; // 80% success rate
  if (success) {
    return { success: true, transactionId: 'txn_' + Date.now() };
  } else {
    return { success: false, error: 'Payment failed' };
  }
}

module.exports = {
  processPayment,
};
