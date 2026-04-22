const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const { sendEmailNotification } = require('../utils/notificationHelper');

const getBooks = asyncHandler(async (req, res) => {
    const [data] = await db.execute('SELECT * FROM book_library ORDER BY created_at DESC');
    
    // Map price fields safely
    const mappedData = data.map(book => {
        const discounted = book.discounted_price || book.discount_price || book.price || 0;
        return {
            ...book,
            discounted_price: discounted,
            price: discounted
        };
    });
    
    res.status(200).json(mappedData);
});

const getBookById = asyncHandler(async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [req.params.id]);
    const book = rows[0];

    if (!book) {
        res.status(404);
        throw new Error('Book not found');
    }

    // Map price fields safely
    const discounted = book.discounted_price || book.discount_price || book.price || 0;
    book.discounted_price = discounted;
    book.price = discounted;

    // Increment Views
    if (req.query.increment !== 'false') {
        db.execute('UPDATE book_library SET views = views + 1 WHERE id = ?', [book.id]);
    }

    res.status(200).json(book);
});

const createBook = asyncHandler(async (req, res) => {
    const columns = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await db.execute(
        `INSERT INTO book_library (${columns.join(', ')}) VALUES (${placeholders})`,
        values
    );

    const [newRows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [result.insertId]);
    const data = newRows[0];

    sendEmailNotification(data, 'book').catch(err => {
        console.error('[BOOK NOTIFICATION ERROR]', err.message);
    });

    res.status(201).json(data);
});

const updateBook = asyncHandler(async (req, res) => {
    const columns = Object.keys(req.body);
    const values = Object.values(req.body);
    const updateString = columns.map(col => `${col} = ?`).join(', ');
    values.push(req.params.id);

    await db.execute(
        `UPDATE book_library SET ${updateString} WHERE id = ?`,
        values
    );

    const [rows] = await db.execute('SELECT * FROM book_library WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
});

const deleteBook = asyncHandler(async (req, res) => {
    await db.execute('UPDATE orders SET book_id = NULL WHERE book_id = ?', [req.params.id]);
    await db.execute('DELETE FROM reviews WHERE item_id = ? AND item_type = "book"', [req.params.id]);
    await db.execute('DELETE FROM book_library WHERE id = ?', [req.params.id]);
    res.status(200).json({ id: req.params.id });
});

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
