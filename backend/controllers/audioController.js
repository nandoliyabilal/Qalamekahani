const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

const getAudioStories = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('audio_stories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    // Fetch ratings for each story
    const { data: reviews } = await supabase.from('reviews').select('item_id, rating').eq('status', 'approved');
    const ratingsMap = {};
    if (reviews) {
        reviews.forEach(r => {
            if (!ratingsMap[r.item_id]) ratingsMap[r.item_id] = { total: 0, count: 0 };
            ratingsMap[r.item_id].total += parseFloat(r.rating);
            ratingsMap[r.item_id].count += 1;
        });
    }

    const storiesWithRating = data.map(s => ({
        ...s,
        rating: ratingsMap[s.id] ? (ratingsMap[s.id].total / ratingsMap[s.id].count).toFixed(1) : 5.0
    }));

    res.status(200).json(storiesWithRating);
});

const getAudioStoryById = asyncHandler(async (req, res) => {
    const id = req.params.id.trim();
    console.log(`[DEBUG] Fetching Audio ID: '${id}'`);

    let story = null;
    let error = null;

    // Attempt 1: Try 'id' column
    try {
        const result = await supabase
            .from('audio_stories')
            .select('*')
            .eq('id', id)
            .single();
        story = result.data;
        error = result.error;
    } catch (e) {
        console.log(`[DEBUG] Query by 'id' failed: ${e.message}`);
    }

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
        supabase.from('audio_stories')
            .update({ views: (story.views || 0) + 1 })
            .eq('id', story.id)
            .then(() => { });
    }

    // Fetch Episodes
    const { data: episodes, error: episodesError } = await supabase
        .from('audio_episodes')
        .select('*')
        .eq('audio_story_id', story.id)
        .order('order_index', { ascending: true });

    // Aggregation of episode ratings
    const { data: epReviews } = await supabase
        .from('reviews')
        .select('item_id, rating')
        .eq('item_type', 'episode')
        .eq('status', 'approved');

    const epRatingsMap = {};
    if (epReviews) {
        epReviews.forEach(r => {
            if (!epRatingsMap[r.item_id]) epRatingsMap[r.item_id] = { total: 0, count: 0 };
            epRatingsMap[r.item_id].total += parseFloat(r.rating);
            epRatingsMap[r.item_id].count += 1;
        });
    }

    story.episodes = (episodes || []).map(ep => ({
        ...ep,
        rating: epRatingsMap[ep.id] ? (epRatingsMap[ep.id].total / epRatingsMap[ep.id].count).toFixed(1) : 5.0
    }));

    // Fetch Rating for the whole story
    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('item_id', story.id)
        .eq('status', 'approved');
    
    if (reviews && reviews.length > 0) {
        const total = reviews.reduce((acc, r) => acc + parseFloat(r.rating), 0);
        story.rating = (total / reviews.length).toFixed(1);
    } else {
        story.rating = 5.0;
    }

    res.status(200).json(story);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    
    const { data, error } = await supabase
        .from('audio_stories')
        .insert([storyData])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
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
        await supabase.from('audio_episodes').insert(episodesToInsert);
    }

    await sendEmailNotification(data, 'audio');
    res.status(201).json(data);
});

const updateAudioStory = asyncHandler(async (req, res) => {
    const { episodes, ...storyData } = req.body;
    
    const { data, error } = await supabase
        .from('audio_stories')
        .update(storyData)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
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
            await supabase.from('audio_episodes').insert(episodesToInsert);
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
