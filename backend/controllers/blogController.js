const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

// @desc    Get all blogs
const getBlogs = asyncHandler(async (req, res) => {
    const [data] = await db.execute('SELECT * FROM blogs ORDER BY created_at DESC');
    res.status(200).json(data);
});

// @desc    Get single blog
const getBlog = asyncHandler(async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM blogs WHERE slug = ?', [req.params.slug]);
    const blog = rows[0];

    if (!blog) {
        res.status(404);
        throw new Error('Blog not found');
    }

    // Increment Views
    if (req.query.increment !== 'false') {
        db.execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [blog.id]);
    }

    res.status(200).json(blog);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

// @desc    Create blog
const createBlog = asyncHandler(async (req, res) => {
    const { title, author, category, readTime, excerpt, content, image, language } = req.body;

    // Generate unique slug from title
    const baseSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

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

    const columns = Object.keys(blogData);
    const values = Object.values(blogData);
    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await db.execute(
        `INSERT INTO blogs (${columns.join(', ')}) VALUES (${placeholders})`,
        values
    );

    const [newRows] = await db.execute('SELECT * FROM blogs WHERE id = ?', [result.insertId]);
    const data = newRows[0];

    // Trigger Notification
    await sendEmailNotification(data, 'blog');

    res.status(201).json(data);
});

// @desc    Update blog
const updateBlog = asyncHandler(async (req, res) => {
    const columns = Object.keys(req.body);
    const values = Object.values(req.body);
    if (columns.length === 0) {
        return res.status(200).json({ message: 'No updates provided' });
    }

    const updateString = columns.map(col => `${col} = ?`).join(', ');
    values.push(req.params.id);

    await db.execute(
        `UPDATE blogs SET ${updateString} WHERE id = ?`,
        values
    );

    const [rows] = await db.execute('SELECT * FROM blogs WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
});

// @desc    Delete blog
const deleteBlog = asyncHandler(async (req, res) => {
    await db.execute('DELETE FROM blogs WHERE id = ?', [req.params.id]);
    res.status(200).json({ id: req.params.id });
});

module.exports = { getBlogs, getBlog, createBlog, updateBlog, deleteBlog };
