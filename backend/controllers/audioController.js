const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const supabase = require('../config/supabase'); // Still used for notification helpers occasionally

const getAudioStories = asyncHandler(async (req, res) => {
    // 1. Fetch main audio stories from MySQL
    const [stories] = await db.execute('SELECT * FROM audio_stories ORDER BY created_at DESC');

    if (!stories || stories.length === 0) {
        return res.json([]);
    }

    // 2. Fetch all extra metadata in parallel
    const [reviewsRes, episodesRes] = await Promise.all([
        db.execute('SELECT item_id, item_type, rating FROM reviews WHERE status = "approved"'),
        db.execute('SELECT id, audio_story_id, duration FROM audio_episodes')
    ]);

    const reviews = reviewsRes[0] || [];
    const allEpisodes = episodesRes[0] || [];

    // 3. Prepare Lookup Maps
    const durationsMap = {}; // story_id -> total seconds
    const countsMap = {};    // story_id -> episode count
    const ratingsMap = {};   // story_id -> { totalRating, reviewCount }
    const epToStoryMap = {}; // ep_id -> story_id

    // Map episodes for counts, durations, and review mapping
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

    // Process reviews (aggregate both story-level and episode-level reviews)
    reviews.forEach(r => {
        let sid = null;
        if (r.item_type === 'audio_story') {
            sid = r.item_id;
        } else if (r.item_type === 'episode' || r.item_type === 'audio') {
            sid = epToStoryMap[r.item_id] || r.item_id; // Fallback if ID is already story_id
        }

        if (sid) {
            if (!ratingsMap[sid]) ratingsMap[sid] = { total: 0, count: 0 };
            ratingsMap[sid].total += parseFloat(r.rating) || 0;
            ratingsMap[sid].count += 1;
        }
    });

    // 4. Merge Data into Final Response
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
    const id = (req.params.id || "").trim();
    if (!id || id === "undefined") {
        res.status(400);
        throw new Error('Invalid Audio ID');
    }
    console.log(`[DEBUG] Fetching Audio ID: '${id}'`);

    let story = null;

    // Fetch from MySQL
    const [rows] = await db.execute('SELECT * FROM audio_stories WHERE id = ? OR slug = ?', [id, id]);
    story = rows[0];

    if (error || !story) {
        // Fallback for list scanning
        console.log(`[DEBUG] Attempting scan/fallback...`);
        const { data: all } = await supabase.from('audio_stories').select('*');
        if (all) {
            story = all.find(s => String(s.id) === id);
        }
    }

    if (!story) {
        res.status(404).json({ message: 'Audio story not found' });
        return;
    }

    // Increment Views
    if (req.query.increment !== 'false') {
        db.execute('UPDATE audio_stories SET views = views + 1 WHERE id = ?', [story.id]);
    }

    // Fetch Episodes from MySQL
    const [episodes] = await db.execute(
        'SELECT * FROM audio_episodes WHERE audio_story_id = ? ORDER BY order_index ASC',
        [story.id]
    );

    // Fetch Rating for the whole story from MySQL
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

    res.status(200).json(story);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    
    // Ensure no unexpected fields are sent to Supabase
    const cleanData = { ...storyData };
    delete cleanData.id;

    const { data, error } = await supabase
        .from('audio_stories')
        .insert([cleanData])
        .select()
        .single();

    if (error) {
        console.error('[AUDIO CREATE ERROR]', error);
        res.status(400);
        throw new Error(`Failed to create audio story: ${error.message}`);
    }

    // Insert episodes if provided
    if (episodes && episodes.length > 0) {
        const episodesToInsert = episodes.map((ep, idx) => ({
            audio_story_id: data.id,
            title: ep.title,
            file_url: ep.file_url,
            duration: ep.duration,
            order_index: idx
        }));
        const { error: epError } = await supabase.from('audio_episodes').insert(episodesToInsert);
        if (epError) console.error('[AUDIO EPISODE INSERT ERROR]', epError);
    }

    await sendEmailNotification(data, 'audio');
    res.status(201).json(data);
});

const updateAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    
    // Remove ID and episodes from the update object
    const updates = { ...storyData };
    delete updates.id;
    delete updates.episodes;

    const { data, error } = await supabase
        .from('audio_stories')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        console.error('[AUDIO UPDATE ERROR]', error);
        res.status(400);
        throw new Error(`Failed to update audio story: ${error.message}`);
    }

    // Sync episodes if provided
    if (episodes) {
        // Simple sync strategy: delete and re-insert
        await supabase
            .from('audio_episodes')
            .delete()
            .eq('audio_story_id', req.params.id);

        if (episodes.length > 0) {
            const episodesToInsert = episodes.map((ep, idx) => ({
                audio_story_id: req.params.id,
                title: ep.title,
                file_url: ep.file_url,
                duration: ep.duration,
                order_index: idx
            }));
            const { error: epError } = await supabase.from('audio_episodes').insert(episodesToInsert);
            if (epError) console.error('[AUDIO EPISODE SYNC ERROR]', epError);
        }
    }

    res.status(200).json(data);
});

const deleteAudioStory = asyncHandler(async (req, res) => {
    const id = req.params.id;
    console.log(`[DEBUG] Deleting Audio ID: '${id}'`);

    if (!id) {
        res.status(400);
        throw new Error('ID is required for deletion');
    }

    // Step 0: Handle Foreign Key Constraints in 'orders' table
    // If an audio story has orders, the DB will block deletion due to foreign key constraint.
    // We nullify the reference in orders so we can delete the audio story.
    try {
        await supabase
            .from('orders')
            .update({ audio_id: null })
            .eq('audio_id', id);

        // Also try for numeric ID just in case
        if (!isNaN(id)) {
            await supabase
                .from('orders')
                .update({ audio_id: null })
                .eq('audio_id', parseInt(id));
        }
    } catch (err) {
        console.warn(`[DEBUG] Orders cleanup warning:`, err.message);
    }

    // Step 1: Try deleting by id (Standard UUID/String)
    const { data, error } = await supabase
        .from('audio_stories')
        .delete()
        .eq('id', id)
        .select();

    if (error) {
        console.error(`[DEBUG] Delete error:`, error.message);
        // Fallback for numeric ID
        if (!isNaN(id)) {
            const { data: dataInt, error: errorInt } = await supabase
                .from('audio_stories')
                .delete()
                .eq('id', parseInt(id))
                .select();

            if (dataInt && dataInt.length > 0) {
                return res.status(200).json({ status: 'success', id });
            }
        }
        res.status(400);
        throw new Error(error.message);
    }

    if (data && data.length > 0) {
        return res.status(200).json({ status: 'success', id });
    }

    res.status(404);
    throw new Error('Audio story not found');
});

const addAudioEpisode = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('audio_episodes')
        .insert([req.body])
        .select()
        .single();
    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(201).json(data);
});

const deleteAudioEpisode = asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('audio_episodes')
        .delete()
        .eq('id', req.params.episodeId);
    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(200).json({ message: 'Episode deleted' });
});

const incrementEpisodeView = asyncHandler(async (req, res) => {
    const { data: episode } = await supabase
        .from('audio_episodes')
        .select('views')
        .eq('id', req.params.episodeId)
        .single();
    
    if (episode) {
        await supabase
            .from('audio_episodes')
            .update({ views: (episode.views || 0) + 1 })
            .eq('id', req.params.episodeId);
    }
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
