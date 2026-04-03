const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');

const getBooks = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }
    res.status(200).json(data);
});

const getBookById = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error || !data) {
        res.status(404);
        throw new Error('Book not found');
    }

    // Increment Views
    if (req.query.increment !== 'false') {
        supabase.from('books')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', data.id)
            .then(() => { });
    }

    res.status(200).json(data);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createBook = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('books')
        .insert([req.body])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Trigger Notification in background (fire and forget)
    sendEmailNotification(data, 'book').catch(err => {
        console.error('[BOOK NOTIFICATION ERROR]', err.message);
    });

    res.status(201).json(data);
});

const updateBook = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('books')
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

const deleteBook = asyncHandler(async (req, res) => {
    // 1. Nullify references in orders to avoid FK block
    await supabase.from('orders').update({ book_id: null }).eq('book_id', req.params.id);

    // 2. Clear reviews related to this book
    await supabase.from('reviews').delete().eq('item_id', req.params.id);

    const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }
    res.status(200).json({ id: req.params.id });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
