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
    saveImage,
    forgotPassword,
    resetPassword,
    googleLogin,
    toggleBlockUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
// Admin Routes
router.post('/admin-login-init', initiateAdminLogin);
router.post('/admin-login-verify', verifyAdminLogin);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/forgotpassword', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.put('/resetpassword', resetPassword);

// Activity Routes
router.post('/like-story', protect, likeStory);
router.post('/save-blog', protect, saveBlog);
router.post('/track-audio', protect, trackAudio);
router.post('/save-audio', protect, saveAudio);
router.post('/save-image', protect, saveImage);
router.post('/toggle-notifications', protect, toggleNotifications);


// Admin Routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/users/:id', protect, authorize('admin'), getUserById);
router.put('/users/:id/block', protect, authorize('admin'), toggleBlockUser);

module.exports = router;
router.put('/users/:id/block', protect, authorize('admin'), toggleBlockUser);

module.exports = router;
