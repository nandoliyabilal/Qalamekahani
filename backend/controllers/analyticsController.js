const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get analytics dashboard data
const getAnalytics = asyncHandler(async (req, res) => {
    // Fetch from analytics table in MySQL
    const [data] = await db.execute(
        'SELECT * FROM analytics ORDER BY last_updated DESC LIMIT 30'
    );

    // Calculate totals
    const totalViews = data.reduce((acc, curr) => acc + (curr.visits || 0), 0);

    res.json({
        dailyStats: data.reverse(),
        totalViews: totalViews
    });
});

// @desc    Record a page view
const recordView = asyncHandler(async (req, res) => {
    const { page } = req.body;

    // Upsert logic for MySQL
    const [existing] = await db.execute('SELECT id, visits FROM analytics WHERE page = ?', [page]);

    if (existing.length > 0) {
        await db.execute(
            'UPDATE analytics SET visits = visits + 1 WHERE id = ?',
            [existing[0].id]
        );
    } else {
        await db.execute(
            'INSERT INTO analytics (page, visits) VALUES (?, 1)',
            [page]
        );
    }

    res.status(200).json({ success: true });
});

module.exports = { getAnalytics, recordView };
