const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
const getStories = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('stories')
        .select('id, title, slug, image, category, summary, author, views, likes, status, created_at, language, youtube_link, price, discount')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    res.status(200).json(data);
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

    let query = supabase.from('stories').select('*');

    if (isUUID) {
        query = query.eq('id', input);
    } else {
        query = query.eq('slug', input);
    }

    const { data, error } = await query.single();

    if (error || !data) {
        // Double check: If slug failed but maybe it was passed as ID format in URL by mistake?
        // Actually, let's keep it simple. If not found, 404.
        res.status(404);
        throw new Error('Story not found');
    }

    // Increment views (Safe approach)
    // We ignore errors here so it doesn't block the response
    if (req.query.increment !== 'false') {
        supabase.rpc('increment_story_views', { row_id: data.id }).then(({ error }) => {
            if (error) {
                // Fallback if RPC doesn't exist
                supabase.from('stories')
                    .update({ views: (data.views || 0) + 1 })
                    .eq('id', data.id)
                    .then(() => { });
            }
        });
    }

    // Clone data to ensure mutability
    let storyData = { ...data };

    // Determine valid identifiers for reviews
    const identifiers = [storyData.id];
    if (storyData.slug) identifiers.push(storyData.slug);
    if (!isUUID) identifiers.push(input); // Add the URL param if it's a slug

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

        // 1. Check Authorization Header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken'); // Require here or top level
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // 2. Check Orders
                const { data: userData } = await supabase.from('users').select('email, role').eq('id', decoded.id).single();

                if (userData) {
                    if (userData.role === 'admin') {
                        hasAccess = true;
                    } else if (userData.email) {
                        const { data: orderData } = await supabase
                            .from('orders')
                            .select('id')
                            .eq('customer_email', userData.email)
                            .eq('story_id', storyData.id)
                            .eq('status', 'paid')
                            .maybeSingle(); // Use maybeSingle to avoid error if no rows

                        if (orderData) hasAccess = true;
                    }
                }
            } catch (error) {
                console.error("Token verification failed", error.message);
            }
        }

        // 3. Obfuscate if no access
        if (!hasAccess) {
            // Keep only H2 tags for chapter listing
            const content = storyData.content || '';
            const matches = content.match(/<h2.*?>.*?<\/h2>/gi);
            storyData.content = matches ? matches.join('\n') : '';
            storyData.isLocked = true;
        } else {
            storyData.isLocked = false;
        }
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

    // Slug generation (improved for Hindi/Unicode)
    let slug = title.toLowerCase()
        .trim()
        .replace(/[^\u0900-\u097F\w\s-]/g, '') // Keep Hindi range + \w + space + dash
        .replace(/\s+/g, '-')                  // Spaces to dashes
        .replace(/-+/g, '-');                  // Multiple dashes to single

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
            hashtags: tags,
            image: coverImage,
            youtube_link: youtubeLink,
            price: price || 0,
            discount: discount || 0,
            author: 'Sabirkhan Pathan'
        }])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
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
    if (tags) updates.hashtags = tags;
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
        res.status(400);
        throw new Error(error.message);
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
