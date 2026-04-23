const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get all stories
const getStories = asyncHandler(async (req, res) => {
    const [data] = await db.execute('SELECT * FROM stories ORDER BY created_at DESC');

    const storiesWithCount = data.map(story => {
        const content = story.content || '';
        const matches = content.match(/<h2|&lt;h2/gi);
        story.parts_count = matches ? matches.length : (content.trim() ? 1 : 0);
        delete story.content;
        return story;
    });

    res.status(200).json(storiesWithCount);
});

// @desc    Get single story
const getStory = asyncHandler(async (req, res) => {
    const input = req.params.slug;
    
    const [rows] = await db.execute('SELECT * FROM stories WHERE id = ? OR slug = ?', [input, input]);
    const storyData = rows[0];

    if (!storyData) {
        res.status(404);
        throw new Error('Story not found');
    }

    if (req.query.increment !== 'false') {
        db.execute('UPDATE stories SET views = views + 1 WHERE id = ?', [storyData.id]);
    }

    const identifiers = [String(storyData.id), storyData.slug];
    const placeholders = identifiers.map(() => '?').join(',');

    const [reviews] = await db.execute(
        `SELECT rating FROM reviews WHERE item_id IN (${placeholders}) AND item_type = "story" AND status = "approved"`,
        identifiers
    );

    let averageRating = 0;
    let reviewCount = reviews.length;
    if (reviewCount > 0) {
        const total = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        averageRating = (total / reviewCount).toFixed(1);
    }
    storyData.rating = averageRating;
    storyData.reviewCount = reviewCount;

    // Access logic
    if (storyData.price > 0) {
        let hasAccess = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const [users] = await db.execute('SELECT email, role FROM users WHERE id = ?', [decoded.id]);
                const userData = users[0];

                if (userData) {
                    if (userData.role === 'admin' || userData.role === 'admin_testing_disabled') {
                        hasAccess = true;
                    } else {
                        const [orders] = await db.execute(
                            'SELECT id FROM orders WHERE customer_email = ? AND story_id = ? AND status = "paid"',
                            [userData.email, storyData.id]
                        );
                        if (orders.length > 0) hasAccess = true;
                    }
                }
            } catch (e) {}
        }

        if (!hasAccess) {
            const content = storyData.content || '';
            const matches = content.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi);
            storyData.content = matches ? matches.join('\n') : '';
            storyData.isLocked = true;
        } else {
            storyData.isLocked = false;
        }
    } else {
        storyData.isLocked = false;
    }

    res.status(200).json(storyData);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

// @desc    Create new story
const createStory = asyncHandler(async (req, res) => {
    const { title, summary, fullContent, category, tags, coverImage, status, language, youtubeLink, price, discount, author } = req.body;

    let slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;

    const storyData = {
        title, slug, summary, content: fullContent, category, status,
        language: language || 'Hindi',
        hashtags: JSON.stringify(Array.isArray(tags) ? tags : (tags ? [tags] : [])),
        image: coverImage,
        youtube_link: youtubeLink,
        price: price || 0,
        discount: discount || 0,
        author: author || 'Sabirkhan Pathan'
    };

    const columns = Object.keys(storyData);
    const placeholders = columns.map(() => '?').join(',');
    const [result] = await db.execute(`INSERT INTO stories (${columns.join(',')}) VALUES (${placeholders})`, Object.values(storyData));

    const [newRows] = await db.execute('SELECT * FROM stories WHERE id = ?', [result.insertId]);
    await sendEmailNotification(newRows[0], 'story');

    res.status(201).json(newRows[0]);
});

// @desc    Update story
const updateStory = asyncHandler(async (req, res) => {
    const fields = req.body;
    const updates = [];
    const values = [];

    // Define allowed columns to prevent "Unknown column" errors
    const allowedColumns = ['title', 'slug', 'content', 'summary', 'category', 'status', 'language', 'author', 'image', 'hashtags', 'views', 'likes', 'rating', 'price', 'discount', 'is_premium', 'youtube_link', 'chapter_stats'];
    const mapping = { fullContent: 'content', coverImage: 'image', youtubeLink: 'youtube_link', tags: 'hashtags' };

    Object.keys(fields).forEach(key => {
        const dbKey = mapping[key] || key;
        if (allowedColumns.includes(dbKey)) {
            updates.push(`${dbKey} = ?`);
            let val = fields[key];
            if (dbKey === 'hashtags') val = JSON.stringify(Array.isArray(val) ? val : [val]);
            values.push(val);
        }
    });

    if (updates.length > 0) {
        values.push(req.params.id);
        await db.execute(`UPDATE stories SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await db.execute('SELECT * FROM stories WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
});

// @desc    Delete story
const deleteStory = asyncHandler(async (req, res) => {
    await db.execute('UPDATE orders SET story_id = NULL WHERE story_id = ?', [req.params.id]);
    await db.execute('DELETE FROM reviews WHERE item_id = ? AND item_type = "story"', [req.params.id]);
    await db.execute('DELETE FROM stories WHERE id = ?', [req.params.id]);
    res.status(200).json({ id: req.params.id });
});

// @desc    Chapter view
const incrementChapterView = asyncHandler(async (req, res) => {
    const { id, index } = req.params;
    const [rows] = await db.execute('SELECT chapter_stats FROM stories WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Not found');

    let stats = rows[0].chapter_stats || {};
    if (typeof stats === 'string') stats = JSON.parse(stats);
    const key = `ch_${index}`;
    stats[key] = (stats[key] || 0) + 1;

    await db.execute('UPDATE stories SET chapter_stats = ? WHERE id = ?', [JSON.stringify(stats), id]);
    res.status(200).json({ success: true, views: stats[key] });
});

// @desc    Chapter rating
const addChapterRating = asyncHandler(async (req, res) => {
    const { id, index } = req.params;
    const { rating } = req.body;
    await db.execute(
        'INSERT INTO chapter_ratings (story_id, chapter_index, rating) VALUES (?, ?, ?)',
        [id, parseInt(index), parseInt(rating)]
    );
    res.status(201).json({ message: 'Success' });
});

// @desc    Chapter stats
const getChapterStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [ratings] = await db.execute('SELECT * FROM chapter_ratings WHERE story_id = ?', [id]);
    const [rows] = await db.execute('SELECT chapter_stats FROM stories WHERE id = ?', [id]);
    
    const views = typeof rows[0].chapter_stats === 'string' ? JSON.parse(rows[0].chapter_stats) : (rows[0].chapter_stats || {});
    const aggregated = {};
    ratings.forEach(r => {
        const idx = r.chapter_index;
        if (!aggregated[idx]) aggregated[idx] = { total: 0, count: 0 };
        aggregated[idx].total += r.rating;
        aggregated[idx].count += 1;
    });

    res.status(200).json({ views, ratings: aggregated });
});

module.exports = {
    getStories, getStory, createStory, updateStory, deleteStory,
    incrementChapterView, addChapterRating, getChapterStats
};
