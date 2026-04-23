const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');

const getBooks = asyncHandler(async (req, res) => {
    const [data] = await db.execute('SELECT * FROM book_library ORDER BY created_at DESC');
    // Ensure frontend compatibility
    const mappedData = data.map(book => ({
        ...book,
        price: book.discounted_price || book.price || 0
    }));
    res.status(200).json(mappedData);
});

const getBookById = asyncHandler(async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [req.params.id]);
    const book = rows[0];

    if (!book) {
        res.status(404);
        throw new Error('Book not found');
    }

    // Ensure frontend compatibility
    book.price = book.discounted_price || book.price || 0;

    // Increment Views
    if (req.query.increment !== 'false') {
        db.execute('UPDATE book_library SET views = views + 1 WHERE id = ?', [book.id]);
    }

    res.status(200).json(book);
});

const { sendEmailNotification } = require('../utils/notificationHelper');

const createBook = asyncHandler(async (req, res) => {
    const allowedColumns = ['title', 'image', 'description', 'language', 'buy_link', 'original_price', 'discounted_price', 'author', 'category', 'status', 'views'];
    const filteredData = {};
    Object.keys(req.body).forEach(key => {
        if (allowedColumns.includes(key)) filteredData[key] = req.body[key];
    });

    const columns = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = columns.map(() => '?').join(', ');

    if (columns.length === 0) return res.status(400).json({ message: 'No valid fields provided' });

    const [result] = await db.execute(
        `INSERT INTO book_library (${columns.join(', ')}) VALUES (${placeholders})`,
        values
    );

    const [newRows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [result.insertId]);
    const data = newRows[0];

    // Trigger Notification
    sendEmailNotification(data, 'book').catch(err => {
        console.error('[BOOK NOTIFICATION ERROR]', err.message);
    });

    res.status(201).json(data);
});

const updateBook = asyncHandler(async (req, res) => {
    const allowedColumns = ['title', 'image', 'description', 'language', 'buy_link', 'original_price', 'discounted_price', 'author', 'category', 'status', 'views'];
    const filteredData = {};
    Object.keys(req.body).forEach(key => {
        if (allowedColumns.includes(key)) filteredData[key] = req.body[key];
    });

    const columns = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const updateString = columns.map(col => `${col} = ?`).join(', ');
    
    if (columns.length === 0) return res.status(400).json({ message: 'No valid fields provided' });

    values.push(req.params.id);

    await db.execute(
        `UPDATE book_library SET ${updateString} WHERE id = ?`,
        values
    );

    const [rows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
});

const deleteBook = asyncHandler(async (req, res) => {
    // 1. Nullify references in orders to avoid FK block
    await db.execute('UPDATE orders SET book_id = NULL WHERE book_id = ?', [req.params.id]);

    // 2. Clear reviews related to this book
    await db.execute('DELETE FROM reviews WHERE item_id = ? AND item_type = "book"', [req.params.id]);

    await db.execute('DELETE FROM book_library WHERE id = ?', [req.params.id]);

    res.status(200).json({ id: req.params.id });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
