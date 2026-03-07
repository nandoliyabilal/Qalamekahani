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
    res.status(200).json(data);
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

    res.status(200).json(story);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createAudioStory = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('audio_stories')
        .insert([req.body])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    await sendEmailNotification(data, 'audio');
    res.status(201).json(data);
});

const updateAudioStory = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('audio_stories')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
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

module.exports = { getAudioStories, getAudioStoryById, createAudioStory, updateAudioStory, deleteAudioStory };
