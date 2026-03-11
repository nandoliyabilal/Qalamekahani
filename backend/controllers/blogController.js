const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

// @desc    Get all blogs
const getBlogs = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, author, category, read_time, excerpt, image, views, likes, created_at, language')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }
    res.status(200).json(data);
});

// @desc    Get single blog
const getBlog = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', req.params.slug)
        .single();

    if (error || !data) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Increment Views
    if (req.query.increment !== 'false') {
        supabase.from('blogs')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', data.id)
            .then(() => { });
    }

    res.status(200).json(data);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

// @desc    Create blog
const createBlog = asyncHandler(async (req, res) => {
    const { title, author, category, readTime, excerpt, content, image, language } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const blogData = {
        title,
        slug,
        author: author || 'Admin',
        category,
        read_time: readTime,
        excerpt,
        content,
        image,
        language: language || 'English'
    };

    const { data, error } = await supabase
        .from('blogs')
        .insert([blogData])
        .select()
        .single();

    if (error) {
        console.error('Error creating blog:', error);
        res.status(400);
        throw new Error(error.message);
    }

    // Trigger Notification
    await sendEmailNotification(data, 'blog');

    res.status(201).json(data);
});

// @desc    Update blog
const updateBlog = asyncHandler(async (req, res) => {
    const { title, author, category, readTime, excerpt, content, image, language } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (author) updates.author = author;
    if (category) updates.category = category;
    if (readTime) updates.read_time = readTime;
    if (excerpt) updates.excerpt = excerpt;
    if (content) updates.content = content;
    if (image) updates.image = image;
    if (language) updates.language = language;

    const { data, error } = await supabase
        .from('blogs')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating blog:', error);
        res.status(400);
        throw new Error(error.message);
    }
    res.status(200).json(data);
});

// @desc    Delete blog
const deleteBlog = asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(200).json({ id: req.params.id });
});

module.exports = { getBlogs, getBlog, createBlog, updateBlog, deleteBlog };
