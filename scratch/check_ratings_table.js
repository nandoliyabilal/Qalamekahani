const db = require('../backend/config/mysql_db');

async function checkTable() {
    try {
        const [rows] = await db.execute('DESCRIBE chapter_ratings');
        console.log('Table structure:');
        console.table(rows);
        
        const [status] = await db.execute('SHOW TABLE STATUS LIKE "chapter_ratings"');
        console.log('\nTable status:');
        console.table(status);
        
        const [data] = await db.execute('SELECT * FROM chapter_ratings LIMIT 5');
        console.log('\nSample data:');
        console.table(data);

        process.exit(0);
    } catch (error) {
        console.error('Error checking table:', error);
        process.exit(1);
    }
}

checkTable();
