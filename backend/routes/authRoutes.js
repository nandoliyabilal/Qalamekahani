const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    initiateAdminLogin,
    verifyAdminLogin,
    getMe,
    updateProfile,
    verifyOtp,
    resendOtp,
    likeStory,
    saveBlog,
    trackAudio,
    saveAudio,
    forgotPassword,
    resetPassword,
    getAllUsers,
    getUserById,
    toggleNotifications
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
// Admin Routes
router.post('/admin-login-init', initiateAdminLogin);
router.post('/admin-login-verify', verifyAdminLogin);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// Activity Routes
router.post('/like-story', protect, likeStory);
router.post('/save-blog', protect, saveBlog);
router.post('/track-audio', protect, trackAudio);
router.post('/save-audio', protect, saveAudio);
router.post('/toggle-notifications', protect, toggleNotifications);

// Admin Routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/users/:id', protect, authorize('admin'), getUserById);

module.exports = router;
