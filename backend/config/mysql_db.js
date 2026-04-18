const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('--- [DB DEBUG] ---');
        console.log('MySQL Connected Successfully');
        console.log('------------------');
        connection.release();
    } catch (err) {
        console.error('--- [DB ERROR] ---');
        console.error('MySQL Connection Failed:', err.message);
        console.error('------------------');
    }
};

testConnection();

module.exports = pool;
