const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        console.log('Successfully connected to MySQL');
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows);
        await connection.end();
    } catch (error) {
        console.error('Error connecting to MySQL:', error.message);
    }
}

testConnection();
