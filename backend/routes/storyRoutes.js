const express = require('express');
const router = express.Router();
const {
    getStories,
    getStory,
    createStory,
    updateStory,
    deleteStory,
    incrementChapterView,
    addChapterRating,
    getChapterStats
} = require('../controllers/storyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getStories)
    .post(protect, authorize('admin', 'editor'), createStory);

router.route('/:slug').get(getStory);

router.route('/:id')
    .put(protect, authorize('admin', 'editor'), updateStory)
    .delete(protect, authorize('admin'), deleteStory);

router.route('/:id/chapters/stats')
    .get(protect, authorize('admin', 'editor'), getChapterStats);

router.route('/:id/chapters/:index/view')
    .post(incrementChapterView);

router.route('/:id/chapters/:index/rating')
    .post(addChapterRating);

module.exports = router;
