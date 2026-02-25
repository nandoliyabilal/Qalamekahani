const express = require('express');
const router = express.Router();
const { getOrders, createRazorpayOrder, verifyPayment, getMyOrders, cancelPayment } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Assuming these exist

router.get('/', protect, authorize('admin'), getOrders);
router.get('/mine', protect, getMyOrders);
router.post('/create', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.post('/cancel', cancelPayment);

module.exports = router;
