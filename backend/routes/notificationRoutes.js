const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get unread notification count
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
        [req.user.id]
    );

    res.status(200).json({ count: rows[0].count || 0 });
}));

// @desc    Get all notifications for user
router.get('/', protect, asyncHandler(async (req, res) => {
    const [rows] = await db.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );

    res.status(200).json(rows);
}));

// @desc    Mark all as read
router.put('/read-all', protect, asyncHandler(async (req, res) => {
    await db.execute(
        'UPDATE notifications SET is_read = true WHERE user_id = ?',
        [req.user.id]
    );

    res.status(200).json({ success: true });
}));

module.exports = router;
