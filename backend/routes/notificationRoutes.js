const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('is_read', false);

    if (error) {
        res.status(500);
        throw new Error('Failed to fetch count');
    }

    res.status(200).json({ count: count || 0 });
}));

// @desc    Get all notifications for user
router.get('/', protect, asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error('Failed to fetch notifications');
    }

    res.status(200).json(data);
}));

// @desc    Mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', req.user.id);

    if (error) {
        res.status(500);
        throw new Error('Failed to update');
    }

    res.status(200).json({ success: true });
}));

module.exports = router;
