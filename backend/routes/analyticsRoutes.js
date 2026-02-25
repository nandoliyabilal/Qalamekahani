const express = require('express');
const router = express.Router();
const { getAnalytics, recordView } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').get(protect, authorize('admin'), getAnalytics);
router.route('/record').post(recordView);

module.exports = router;
