const db = require('./backend/config/mysql_db');

const migrate = async () => {
    try {
        console.log('Running migration...');
        // Add likes to audio_stories if not exists
        await db.execute(`
            ALTER TABLE audio_stories 
            ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0
        `);
        
        // Add likes to stories if not exists (should be there but just in case)
        await db.execute(`
            ALTER TABLE stories 
            ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0
        `);
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
