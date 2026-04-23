const db = require('../backend/config/mysql_db');

async function checkUsersTable() {
    try {
        console.log('--- [USERS TABLE] ---');
        const [rows] = await db.execute('DESCRIBE users');
        console.table(rows);
        
        const [status] = await db.execute('SHOW TABLE STATUS LIKE "users"');
        console.log('\nTable Status:');
        console.table(status);

        const [sample] = await db.execute('SELECT id, email FROM users LIMIT 5');
        console.log('\nSample Users:');
        console.table(sample);

        process.exit(0);
    } catch (error) {
        console.error('Error checking users table:', error);
        process.exit(1);
    }
}

checkUsersTable();
