const express = require('express');
const router = express.Router();
const { submitContactForm, subscribeNewsletter } = require('../controllers/contactController');

router.post('/', submitContactForm);
router.post('/subscribe', subscribeNewsletter);

module.exports = router;
