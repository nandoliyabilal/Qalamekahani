const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    });

    try {
        console.log('--- AUDIO STORIES SCHEMA ---');
        const [audioCols] = await connection.execute('DESCRIBE audio_stories');
        console.table(audioCols);

        console.log('\n--- BOOK LIBRARY SCHEMA ---');
        const [bookCols] = await connection.execute('DESCRIBE book_library');
        console.table(bookCols);
        
        console.log('\n--- REVIEWS SCHEMA ---');
        const [reviewCols] = await connection.execute('DESCRIBE reviews');
        console.table(reviewCols);

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkSchema();
