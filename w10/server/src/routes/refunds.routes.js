const express = require('express');
const refundService = require('../services/refund.service');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/payments/:payment_id/refunds', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { payment_id } = req.params;
		const { reservation_id, amount, reason, metadata } = req.body;
		const created = await refundService.createRefund({ payment_id, reservation_id, amount, reason, metadata });
		res.status(201).json(created);
	} catch (err) {
		next(err);
	}
});

router.get('/refunds/:refund_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const refund = await refundService.getRefund(req.params.refund_id);
		res.json(refund);
	} catch (err) {
		next(err);
	}
});

router.patch('/refunds/:refund_id', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const updated = await refundService.updateRefund(req.params.refund_id, req.body);
		res.json(updated);
	} catch (err) {
		next(err);
	}
});

router.get('/refunds', authMiddleware.authenticateRequired, async (req, res, next) => {
	try {
		const { payment_id, reservation_id, status, page, limit } = req.query;
		const opts = {};
		if (payment_id) opts.payment_id = payment_id;
		if (reservation_id) opts.reservation_id = reservation_id;
		if (status) opts.status = status;
		if (page) opts.page = Number(page);
		if (limit) opts.limit = Number(limit);
		const list = await refundService.listRefunds(opts);
		res.json(list);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
