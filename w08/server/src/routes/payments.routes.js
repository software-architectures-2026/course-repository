const express = require('express');
const paymentService = require('../services/payment.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/reservations/:reservation_id/payments', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { reservation_id } = req.params;
		const { amount, method, gateway_data } = req.body;
		const created = await paymentService.initiatePayment({ reservation_id, amount, method, gateway_data });
		res.status(201).json(created);
	} catch (err) {
		next(err);
	}
});

router.get('/payments/:payment_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const payment = await paymentService.getPayment(req.params.payment_id);
		res.json(payment);
	} catch (err) {
		next(err);
	}
});

router.post('/payments/:payment_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		// action endpoint for payments (e.g., capture)
		const { action } = req.body;
		if (action === 'capture') {
			const updated = await paymentService.capturePayment(req.params.payment_id, { gateway_response: req.body.gateway_response || null });
			res.json(updated);
			return;
		}
		res.status(400).json({ error: 'Unknown payment action' });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
