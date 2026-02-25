const express = require('express');
const router = express.Router();
const { getAudioStories, getAudioStoryById, createAudioStory, updateAudioStory, deleteAudioStory } = require('../controllers/audioController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAudioStories)
    .post(protect, authorize('admin'), createAudioStory);

router.route('/:id')
    .get(getAudioStoryById)
    .put(protect, authorize('admin'), updateAudioStory)
    .delete(protect, authorize('admin'), deleteAudioStory);

module.exports = router;
