const db = require('../backend/config/mysql_db');

async function checkStoriesTable() {
    try {
        console.log('--- [STORIES TABLE] ---');
        const [rows] = await db.execute('DESCRIBE stories');
        console.table(rows);
        
        console.log('\n--- [CHAPTER_RATINGS TABLE] ---');
        const [rows2] = await db.execute('DESCRIBE chapter_ratings');
        console.table(rows2);

        process.exit(0);
    } catch (error) {
        console.error('Error checking tables:', error);
        process.exit(1);
    }
}

checkStoriesTable();
