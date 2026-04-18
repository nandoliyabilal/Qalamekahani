const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const initDb = async () => {
    // 1. Connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: process.env.MYSQL_HOST === 'localhost' ? 'root' : process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD
    });

    console.log(`\n--- Recreating Database: ${process.env.MYSQL_DATABASE} ---`);
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.MYSQL_DATABASE}`);
    await connection.query(`CREATE DATABASE ${process.env.MYSQL_DATABASE}`);
    await connection.query(`USE ${process.env.MYSQL_DATABASE}`);

    // 2. Read and Split SQL file
    const sqlPath = path.join(__dirname, '../../migration_structure.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon, but be careful with comments and newlines
    const queries = sql
        .split(';')
        .filter(query => query.trim().length > 0);

    console.log(`Found ${queries.length} queries in migration_structure.sql`);

    // 3. Execute Queries
    for (let query of queries) {
        try {
            await connection.query(query);
            // console.log('Successfully executed query:', query.substring(0, 50) + '...');
        } catch (err) {
            console.error('Error executing query:', err.message);
            // console.error('Query:', query);
        }
    }

    console.log(`\n--- MySQL Schema Initialized Successfully ---`);
    await connection.end();
};

initDb().catch(err => {
    console.error('Failed to initialize MySQL:', err);
    process.exit(1);
});
