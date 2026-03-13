const express = require('express');
const router = express.Router();
const {
    getStories,
    getStory,
    createStory,
    updateStory,
    deleteStory
} = require('../controllers/storyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getStories)
    .post(protect, authorize('admin', 'editor'), createStory);

router.route('/:slug').get(getStory);

router.route('/:id')
    .put(protect, authorize('admin', 'editor'), updateStory)
    .delete(protect, authorize('admin'), deleteStory);

router.route('/:id/chapters/:index/view')
    .post(incrementChapterView);

module.exports = router;
