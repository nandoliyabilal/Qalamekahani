const express = require('express');
const router = express.Router();
const { 
    getAudioStories, 
    getAudioStoryById, 
    createAudioStory, 
    updateAudioStory, 
    deleteAudioStory,
    addAudioEpisode,
    deleteAudioEpisode,
    incrementEpisodeView
} = require('../controllers/audioController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getAudioStories)
    .post(protect, authorize('admin'), createAudioStory);

router.route('/:id')
    .get(getAudioStoryById)
    .put(protect, authorize('admin'), updateAudioStory)
    .delete(protect, authorize('admin'), deleteAudioStory);

router.route('/episodes')
    .post(protect, authorize('admin'), addAudioEpisode);

router.route('/episodes/:episodeId')
    .delete(protect, authorize('admin'), deleteAudioEpisode);

router.route('/episodes/:episodeId/view')
    .post(incrementEpisodeView);

module.exports = router;
