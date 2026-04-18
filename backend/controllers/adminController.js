const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 19).replace('T', ' ');

    const [
        [userCounts],
        [activeUserCounts],
        [reviewCounts],
        [storyCounts],
        [audioCounts],
        [bookCounts],
        [blogCounts],
        [recentUsers],
        [storyViews],
        [audioViews],
        [bookViews],
        [blogViews],
        [galleryStats],
        [earnings]
    ] = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM users'),
        db.execute('SELECT COUNT(*) as count FROM users WHERE last_login >= ?', [yesterdayStr]),
        db.execute('SELECT COUNT(*) as count FROM reviews'),
        db.execute('SELECT COUNT(*) as count FROM stories'),
        db.execute('SELECT COUNT(*) as count FROM audio_stories'),
        db.execute('SELECT COUNT(*) as count FROM book_library'),
        db.execute('SELECT COUNT(*) as count FROM blogs'),
        db.execute('SELECT id, name, email, created_at, is_verified, role FROM users WHERE role = "user" ORDER BY created_at DESC LIMIT 5'),
        db.execute('SELECT SUM(views) as total FROM stories'),
        db.execute('SELECT SUM(views) as total FROM audio_stories'),
        db.execute('SELECT SUM(views) as total FROM book_library'),
        db.execute('SELECT SUM(views) as total FROM blogs'),
        db.execute('SELECT SUM(downloads) as total FROM gallery'),
        db.execute('SELECT SUM(amount) as total FROM orders WHERE status = "paid"')
    ]);

    const totalViews = (Number(storyViews[0].total) || 0) + 
                       (Number(audioViews[0].total) || 0) + 
                       (Number(bookViews[0].total) || 0) + 
                       (Number(blogViews[0].total) || 0);

    res.json({
        users: {
            total: userCounts[0].count,
            active: activeUserCounts[0].count
        },
        content: {
            stories: storyCounts[0].count,
            audio: audioCounts[0].count,
            books: bookCounts[0].count,
            blogs: blogCounts[0].count,
            reviews: reviewCounts[0].count,
            totalViews: totalViews,
            totalDownloads: Number(galleryStats[0].total) || 0,
            totalEarnings: Number(earnings[0].total) || 0
        },
        recentUsers: recentUsers
    });
});

// @desc    Get detailed earnings by item
const getEarningsDetails = asyncHandler(async (req, res) => {
    const [orders] = await db.execute(
        'SELECT amount, status, story_id, book_id, audio_id, book_title, created_at FROM orders WHERE status = "paid"'
    );

    // Group by item
    const earningsByItem = {};

    orders.forEach(order => {
        const itemId = order.story_id || order.book_id || order.audio_id || 'unknown';
        const type = order.story_id ? 'Story' : (order.book_id ? 'Book' : (order.audio_id ? 'Audio' : 'Other'));
        
        if (!earningsByItem[itemId]) {
            earningsByItem[itemId] = {
                id: itemId,
                title: order.book_title || 'Unknown Title',
                type: type,
                totalEarned: 0,
                salesCount: 0
            };
        }
        
        earningsByItem[itemId].totalEarned += parseFloat(order.amount) || 0;
        earningsByItem[itemId].salesCount += 1;
    });

    res.json(Object.values(earningsByItem).sort((a, b) => b.totalEarned - a.totalEarned));
});

module.exports = {
    getDashboardStats,
    getEarningsDetails
};
