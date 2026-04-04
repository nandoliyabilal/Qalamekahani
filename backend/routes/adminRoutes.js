const express = require('express');
const router = express.Router();
const { getDashboardStats, getEarningsDetails } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/earnings', protect, authorize('admin'), getEarningsDetails);

module.exports = router;
