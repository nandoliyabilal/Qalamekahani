const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
const getStories = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('stories')
        .select('*') // Necessary to calculate parts_count
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    // Optimization: Calculate parts_count and remove heavy content field
    const storiesWithCount = data.map(story => {
        const content = story.content || '';
        // Handle both encoded &lt;h2 and decoded <h2
        const matches = content.match(/<h2|&lt;h2/gi);
        story.parts_count = matches ? matches.length : (content.trim() ? 1 : 0);
        delete story.content; // Keep payload small
        return story;
    });

    res.status(200).json(storiesWithCount);
});

// @desc    Get single story
// @route   GET /api/stories/:slug
// @access  Public
// @desc    Get single story
// @route   GET /api/stories/:slug
// @access  Public
const getStory = asyncHandler(async (req, res) => {
    const input = req.params.slug;

    // Check if input is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

    let storyData = null;
    console.log(`[DEBUG] getStory searching for: '${input}' (isUUID: ${isUUID})`);

    // Use a more robust query for slug/ID matching
    let query = supabase.from('stories').select('*');
    if (isUUID) {
        query = query.eq('id', input);
    } else {
        query = query.eq('slug', input);
    }

    const { data: result, error } = await query.maybeSingle();

    if (error) {
        console.log(`[DEBUG] Database query error:`, error);
        res.status(500);
        throw new Error('Database error during story lookup');
    }

    if (!result) {
        // Fallback: If not found by slug, try searching by title or partial slug if needed, 
        // but for now let's just log and fail properly.
        console.log(`[DEBUG] Story NOT FOUND for: '${input}'`);
        res.status(404);
        throw new Error('Story not found');
    }

    storyData = { ...result };

    // Increment views (Safe approach)
    if (req.query.increment !== 'false') {
        supabase.rpc('increment_story_views', { row_id: storyData.id }).then(({ error: rpcErr }) => {
            if (rpcErr) {
                supabase.from('stories')
                    .update({ views: (storyData.views || 0) + 1 })
                    .eq('id', storyData.id)
                    .then(() => { });
            }
        });
    }

    // Determine valid identifiers for reviews
    const identifiers = [storyData.id];
    if (storyData.slug) identifiers.push(storyData.slug);
    
    // Use the actual parameters if they differ
    if (input && !identifiers.includes(input)) identifiers.push(input);

    // Fetch reviews from Supabase
    const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .in('item_id', identifiers)
        .eq('item_type', 'story')
        .eq('status', 'approved');

    let averageRating = 0;
    let reviewCount = 0;

    if (reviews && reviews.length > 0) {
        reviewCount = reviews.length;
        const total = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        averageRating = (total / reviewCount).toFixed(1);
    }

    // Assign calculated values to response data
    storyData.rating = averageRating;
    storyData.reviewCount = reviewCount;

    // Verify Access for Paid Stories
    if (storyData.price && storyData.price > 0) {
        let hasAccess = false;
        let isPowerUser = false;

        // 1. Check Authorization
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
            try {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                const { data: userData } = await supabase.from('users').select('email, role').eq('id', decoded.id).single();

                if (userData) {
                    isPowerUser = (userData.role === 'admin' || userData.role === 'admin_testing_disabled');
                    
                    // Automatically grant access ONLY for testing_disabled role
                    if (userData.role === 'admin_testing_disabled') {
                        hasAccess = true;
                    } else if (userData.email) {
                        // Check for paid order
                        const { data: orderData } = await supabase
                            .from('orders')
                            .select('id')
                            .eq('customer_email', userData.email)
                            .eq('story_id', storyData.id)
                            .eq('status', 'paid')
                            .maybeSingle();

                        if (orderData) hasAccess = true;
                    }
                }
            } catch (error) {
                console.error("[DEBUG] Token verification failed:", error.message);
            }
        }

        // 3. Access Decision
        if (!hasAccess && !isPowerUser) {
            // Strip content for non-paying regular users
            const content = storyData.content || '';
            const matches = content.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi);
            storyData.content = (matches && Array.isArray(matches)) ? matches.join('\n') : '';
            storyData.isLocked = true;
        } else {
            // Unlocked or Admin
            // If it's an admin who hasn't "bought" it, we keep isLocked=true so they see the button,
            // but we DON'T strip the content so they can still read.
            storyData.isLocked = !hasAccess; 
        }
    } else {
        storyData.isLocked = false;
        console.log(`[DEBUG] Story is FREE: '${storyData.title}'`);
    }

    res.status(200).json(storyData);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

// @desc    Create new story
// @route   POST /api/stories
// @access  Private (Admin)
const createStory = asyncHandler(async (req, res) => {
    const { title, summary, fullContent, category, tags, coverImage, status, language, youtubeLink, price, discount } = req.body;

    if (!title || !fullContent || !category) {
        res.status(400);
        throw new Error('Please include all required fields');
    }

    // Robust Slug Generation
    let slug = title.toLowerCase()
        .trim()
        .replace(/[^\u0900-\u097F\w\s-]/g, '') // Keep Hindi + alphanumeric + space + dash
        .replace(/\s+/g, '-')                  // Spaces to dashes
        .replace(/-+/g, '-');                  // Multiple dashes to single

    // Append short hash for uniqueness if title is common
    slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;

    // Fallback if slug is empty or just dashes
    if (!slug || slug === '-' || slug === '--') {
        slug = `story-${Date.now()}`;
    }

    const { data, error } = await supabase
        .from('stories')
        .insert([{
            title,
            slug,
            summary,
            content: fullContent,
            category,
            status,
            language: language || 'Hindi', // Default
            hashtags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
            image: coverImage,
            youtube_link: youtubeLink,
            price: price || 0,
            discount: discount || 0,
            author: 'Sabirkhan Pathan'
        }])
        .select()
        .single();

    if (error) {
        console.error('[STORY CREATE ERROR]', error);
        res.status(400);
        throw new Error(`Failed to create story: ${error.message}`);
    }

    // Trigger Notification (Wait for it to send)
    await sendEmailNotification(data, 'story');

    res.status(201).json(data);
});

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private (Admin)
const updateStory = asyncHandler(async (req, res) => {
    const { title, summary, fullContent, category, tags, coverImage, status, language, youtubeLink, price, discount } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (summary) updates.summary = summary;
    if (fullContent) updates.content = fullContent;
    if (category) updates.category = category;
    if (language) updates.language = language;
    if (tags) updates.hashtags = Array.isArray(tags) ? tags : [tags]; // Ensure array
    if (coverImage) updates.image = coverImage;
    if (status) updates.status = status;
    if (youtubeLink !== undefined) updates.youtube_link = youtubeLink;
    if (price !== undefined && price !== '') updates.price = Number(price);
    if (discount !== undefined && discount !== '') updates.discount = Number(discount);

    const { data, error } = await supabase
        .from('stories')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        console.error('[STORY UPDATE ERROR]', error);
        res.status(400);
        throw new Error(`Failed to update story: ${error.message}`);
    }

    res.status(200).json(data);
});

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
const deleteStory = asyncHandler(async (req, res) => {
    // 1. Nullify references in orders to avoid FK block
    await supabase.from('orders').update({ story_id: null }).eq('story_id', req.params.id);

    // 2. Clear reviews related to this story
    await supabase.from('reviews').delete().eq('item_id', req.params.id);

    // 3. Delete the story
    const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(200).json({ id: req.params.id });
});

// @desc    Increment chapter view
// @route   POST /api/stories/:id/chapters/:index/view
// @access  Public
const incrementChapterView = asyncHandler(async (req, res) => {
    const { id, index } = req.params;

    // 1. Get current stats
    const { data: story, error: getError } = await supabase
        .from('stories')
        .select('chapter_stats')
        .eq('id', id)
        .single();

    if (getError || !story) {
        res.status(404);
        throw new Error('Story not found');
    }

    let stats = story.chapter_stats || {};
    if (typeof stats === 'string') stats = JSON.parse(stats);

    // 2. Increment view for this index
    const key = `ch_${index}`;
    stats[key] = (stats[key] || 0) + 1;

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('stories')
        .update({ chapter_stats: stats })
        .eq('id', id);

    if (updateError) {
        res.status(500);
        throw new Error('Failed to update chapter views');
    }

    res.status(200).json({ success: true, views: stats[key] });
});

// @desc    Add rating for a specific chapter
// @route   POST /api/stories/:id/chapters/:index/rating
// @access  Public
const addChapterRating = asyncHandler(async (req, res) => {
    const { id, index } = req.params;
    const { rating } = req.body;

    if (!rating) {
        res.status(400);
        throw new Error('Rating is required');
    }

    const { error } = await supabase.from('chapter_ratings').insert([{
        story_id: id,
        chapter_index: parseInt(index),
        rating: parseInt(rating)
    }]);

    if (error) {
        console.error('Chapter Rating Fail:', error);
        res.status(400);
        throw new Error('Failed to save chapter rating');
    }

    res.status(201).json({ message: 'Chapter rated successfully' });
});

// @desc    Get stats for all chapters (Admin)
// @route   GET /api/stories/:id/chapters/stats
// @access  Private (Admin)
const getChapterStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Get Ratings
    const { data: ratings, error: rateError } = await supabase
        .from('chapter_ratings')
        .select('*')
        .eq('story_id', id);

    // 2. Get Views from story JSON
    const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('chapter_stats')
        .eq('id', id)
        .single();

    if (storyError) {
        res.status(404);
        throw new Error('Story stats not found');
    }

    const views = typeof story.chapter_stats === 'string' ? JSON.parse(story.chapter_stats) : (story.chapter_stats || {});

    // Aggregate Ratings by Chapter Index
    const aggregated = {};
    if (ratings) {
        ratings.forEach(r => {
            const idx = r.chapter_index;
            if (!aggregated[idx]) aggregated[idx] = { total: 0, count: 0 };
            aggregated[idx].total += r.rating;
            aggregated[idx].count += 1;
        });
    }

    // Return structured data
    res.status(200).json({
        views: views,
        ratings: aggregated
    });
});

module.exports = {
    getStories,
    getStory,
    createStory,
    updateStory,
    deleteStory,
    incrementChapterView,
    addChapterRating,
    getChapterStats
};
