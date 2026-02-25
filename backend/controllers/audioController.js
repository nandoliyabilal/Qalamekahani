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
        // Checking for fetch error (e.g. invalid syntax for UUID if 'id' is int)
        console.log(`[DEBUG] Query by 'id' failed: ${e.message}`);
    }

    // Attempt 2: If failed or not found, try '_id' column (if it exists)
    if (!story || (error && error.code !== 'PGRST116')) {
        console.log(`[DEBUG] Retrying with '_id'...`);
        try {
            const fallback = await supabase
                .from('audio_stories')
                .select('*')
                .eq('_id', id)
                .single();

            if (fallback.data) {
                story = fallback.data;
                error = null; // Clear error if found
            }
        } catch (e2) {
            console.log(`[DEBUG] Query by '_id' also failed: ${e2.message}`);
        }
    }

    if (error || !story) {
        // Fallback for list scanning (Last Resort - Slow but reliable)
        if (!story) {
            console.log(`[DEBUG] Last Resort: Scanning list...`);
            const { data: all } = await supabase.from('audio_stories').select('*');
            if (all) {
                story = all.find(s => String(s.id) === id || String(s._id) === id);
            }
        }
    }

    if (!story) {
        // Collect diagnostics
        const diagnostics = {
            searchedId: id,
            idLength: id.length,
            errorMsg: error ? error.message : 'No DB Error',
            fallbackChecked: true,
            foundInFallback: false
        };
        console.error(`[ERROR] Audio 404 Diagnostics:`, diagnostics);

        res.status(404).json({
            message: `Audio story not found. Diagnostics: ID=${id}, Len=${id.length}, DB_Err=${error?.code}`,
            diagnostics
        });
        throw new Error('Audio story not found'); // This might be caught by error handler but json sent already
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

    // Trigger Notification
    sendEmailNotification(data, 'audio');

    res.status(201).json(data);
});

// Implement Update/Delete similarly if needed
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
    const { error } = await supabase
        .from('audio_stories')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(200).json({ id: req.params.id });
});

module.exports = { getAudioStories, getAudioStoryById, createAudioStory, updateAudioStory, deleteAudioStory };
