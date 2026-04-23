const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

const getAudioStories = asyncHandler(async (req, res) => {
    // 1. Fetch main audio stories from MySQL
    const [stories] = await db.execute('SELECT * FROM audio_stories ORDER BY created_at DESC');

    if (!stories || stories.length === 0) {
        return res.json([]);
    }

    // 2. Fetch all extra metadata in parallel
    const [reviewsRes] = await db.execute('SELECT item_id, item_type, rating FROM reviews WHERE status = "approved"');
    const [episodesRes] = await db.execute('SELECT id, audio_story_id, duration FROM audio_episodes');

    const reviews = reviewsRes || [];
    const allEpisodes = episodesRes || [];

    const durationsMap = {};
    const countsMap = {};
    const ratingsMap = {};
    const epToStoryMap = {};

    allEpisodes.forEach(ep => {
        const sid = ep.audio_story_id;
        epToStoryMap[ep.id] = sid;
        countsMap[sid] = (countsMap[sid] || 0) + 1;

        if (ep.duration && ep.duration.includes(':')) {
            const parts = ep.duration.split(':').map(p => parseInt(p) || 0);
            let secs = 0;
            if (parts.length === 2) secs = (parts[0] * 60) + parts[1];
            else if (parts.length === 3) secs = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
            durationsMap[sid] = (durationsMap[sid] || 0) + secs;
        }
    });

    reviews.forEach(r => {
        let sid = null;
        if (r.item_type === 'audio_story') sid = r.item_id;
        else if (r.item_type === 'episode' || r.item_type === 'audio') sid = epToStoryMap[r.item_id] || r.item_id;

        if (sid) {
            if (!ratingsMap[sid]) ratingsMap[sid] = { total: 0, count: 0 };
            ratingsMap[sid].total += parseFloat(r.rating) || 0;
            ratingsMap[sid].count += 1;
        }
    });

    const result = stories.map(s => {
        const ratingData = ratingsMap[s.id];
        const avgRating = ratingData ? (ratingData.total / ratingData.count) : 0;
        
        let displayDuration = s.duration || '0:00';
        if (durationsMap[s.id] > 0) {
            const ts = durationsMap[s.id];
            const h = Math.floor(ts / 3600);
            const m = Math.floor((ts % 3600) / 60);
            const s_rem = ts % 60;
            displayDuration = h > 0 ? `${h}h ${m}m` : `${m}m ${s_rem}s`;
        }

        return {
            ...s,
            episodes_count: countsMap[s.id] || 0,
            rating: parseFloat(avgRating.toFixed(1)),
            review_count: ratingData ? ratingData.count : 0,
            calculated_duration: displayDuration
        };
    });

    res.status(200).json(result);
});

const getAudioStoryById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const [rows] = await db.execute('SELECT * FROM audio_stories WHERE id = ? OR slug = ?', [id, id]);
    const story = rows[0];

    if (!story) {
        return res.status(404).json({ message: 'Audio story not found' });
    }

    if (req.query.increment !== 'false') {
        await db.execute('UPDATE audio_stories SET views = views + 1 WHERE id = ?', [story.id]);
    }

    const [episodes] = await db.execute(
        'SELECT * FROM audio_episodes WHERE audio_story_id = ? ORDER BY order_index ASC',
        [story.id]
    );

    const [reviews] = await db.execute(
        'SELECT rating FROM reviews WHERE item_id = ? AND status = "approved"',
        [story.id]
    );
    
    if (reviews && reviews.length > 0) {
        const total = reviews.reduce((acc, r) => acc + parseFloat(r.rating), 0);
        story.rating = (total / reviews.length).toFixed(1);
    } else {
        story.rating = 0.0;
    }

    story.episodes = episodes;
    res.status(200).json(story);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    const allowedColumns = ['title', 'slug', 'description', 'category', 'language', 'author', 'image', 'audio_url', 'file_url', 'duration', 'views', 'status', 'is_premium', 'price', 'discount', 'is_featured'];

    const filteredData = {};
    Object.keys(storyData).forEach(key => {
        if (allowedColumns.includes(key)) filteredData[key] = storyData[key];
    });

    if (!filteredData.slug && filteredData.title) {
        filteredData.slug = filteredData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        filteredData.slug = `${filteredData.slug}-${Date.now().toString(36)}`;
    }

    const columns = Object.keys(filteredData).join(',');
    const placeholders = Object.keys(filteredData).map(() => '?').join(',');
    const [result] = await db.execute(`INSERT INTO audio_stories (${columns}) VALUES (${placeholders})`, Object.values(filteredData));
    const newId = result.insertId;

    if (episodes && episodes.length > 0) {
        for (const [idx, ep] of episodes.entries()) {
            await db.execute(
                'INSERT INTO audio_episodes (audio_story_id, title, file_url, duration, order_index) VALUES (?, ?, ?, ?, ?)',
                [newId, ep.title, ep.file_url, ep.duration, idx]
            );
        }
    }

    const [newRows] = await db.execute('SELECT * FROM audio_stories WHERE id = ?', [newId]);
    await sendEmailNotification(newRows[0], 'audio');
    res.status(201).json(newRows[0]);
});

const updateAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    const id = req.params.id;

    // Define allowed columns to prevent "Unknown column" errors
    const allowedColumns = ['title', 'slug', 'description', 'category', 'language', 'author', 'image', 'audio_url', 'file_url', 'duration', 'views', 'status', 'is_premium', 'price', 'discount', 'is_featured'];

    const updates = [];
    const values = [];
    Object.keys(storyData).forEach(key => {
        if (allowedColumns.includes(key)) {
            updates.push(`${key} = ?`);
            values.push(storyData[key]);
        }
    });

    if (updates.length > 0) {
        values.push(id);
        await db.execute(`UPDATE audio_stories SET ${updates.join(',')} WHERE id = ?`, values);
    }

    if (episodes) {
        await db.execute('DELETE FROM audio_episodes WHERE audio_story_id = ?', [id]);
        for (const [idx, ep] of episodes.entries()) {
            await db.execute(
                'INSERT INTO audio_episodes (audio_story_id, title, file_url, duration, order_index) VALUES (?, ?, ?, ?, ?)',
                [id, ep.title, ep.file_url, ep.duration, idx]
            );
        }
    }

    const [rows] = await db.execute('SELECT * FROM audio_stories WHERE id = ?', [id]);
    res.status(200).json(rows[0]);
});

const deleteAudioStory = asyncHandler(async (req, res) => {
    const id = req.params.id;
    await db.execute('UPDATE orders SET audio_id = NULL WHERE audio_id = ?', [id]);
    await db.execute('DELETE FROM audio_episodes WHERE audio_story_id = ?', [id]);
    await db.execute('DELETE FROM audio_stories WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', id });
});

const addAudioEpisode = asyncHandler(async (req, res) => {
    const { audio_story_id, title, file_url, duration, order_index } = req.body;
    const [result] = await db.execute(
        'INSERT INTO audio_episodes (audio_story_id, title, file_url, duration, order_index) VALUES (?, ?, ?, ?, ?)',
        [audio_story_id, title, file_url, duration, order_index]
    );
    const [rows] = await db.execute('SELECT * FROM audio_episodes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
});

const deleteAudioEpisode = asyncHandler(async (req, res) => {
    await db.execute('DELETE FROM audio_episodes WHERE id = ?', [req.params.episodeId]);
    res.status(200).json({ message: 'Episode deleted' });
});

const incrementEpisodeView = asyncHandler(async (req, res) => {
    await db.execute('UPDATE audio_episodes SET views = views + 1 WHERE id = ?', [req.params.episodeId]);
    res.status(200).json({ status: 'success' });
});

module.exports = { 
    getAudioStories, 
    getAudioStoryById, 
    createAudioStory, 
    updateAudioStory, 
    deleteAudioStory,
    addAudioEpisode,
    deleteAudioEpisode,
    incrementEpisodeView
};
