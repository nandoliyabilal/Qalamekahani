const express = require('express');
const router = express.Router();
const { getReviews, createReview, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getReviews) // Public to allow frontend to fetch reviews
    .post(protect, createReview);

router.route('/:id')
    .put(protect, authorize('admin'), updateReviewStatus)
    .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
