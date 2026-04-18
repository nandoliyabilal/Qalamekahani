const supabase = require('../config/supabase');
const db = require('../config/mysql_db');

/**
 * MIGRATION SCRIPT: Supabase -> MySQL (Robust Version)
 */

const getTableColumns = async (tableName) => {
    const [rows] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);
    return rows.map(row => row.Field);
};

const migrateTable = async (sbTable, myTable = null) => {
    const targetTable = myTable || sbTable;
    console.log(`\n--- Migrating ${sbTable} -> ${targetTable} ---`);

    // 1. Fetch from Supabase
    const { data: supabaseData, error: sbError } = await supabase.from(sbTable).select('*');
    if (sbError || !supabaseData || supabaseData.length === 0) {
        console.log(`No data or error in Supabase ${sbTable}:`, sbError?.message || 'Empty');
        return;
    }

    // 2. Get MySQL columns to ensure we only insert what's supported
    const myColumns = await getTableColumns(targetTable);
    const sbColumns = Object.keys(supabaseData[0]);
    
    // Intersection of columns
    const commonColumns = sbColumns.filter(col => myColumns.includes(col));
    
    if (commonColumns.length === 0) {
        console.warn(`No common columns found for ${sbTable}. Mapping manually...`);
        // Manual mapping for known mismatches
        if (sbTable === 'books' && targetTable === 'book_library') {
             // Map manually if needed
        }
    }

    const placeholders = commonColumns.map(() => '?').join(', ');
    const query = `INSERT IGNORE INTO ${targetTable} (${commonColumns.join(', ')}) VALUES (${placeholders})`;

    let successCount = 0;
    for (const record of supabaseData) {
        const values = commonColumns.map(col => {
            let val = record[col];
            if (Array.isArray(val)) val = JSON.stringify(val); // Handle array types
            return val;
        });
        try {
            await db.execute(query, values);
            successCount++;
        } catch (err) {
            // console.error(`Insert failed for ${sbTable}:`, err.message);
        }
    }
    console.log(`Migrated ${successCount}/${supabaseData.length} records.`);
};

const run = async () => {
    try {
        await migrateTable('users');
        await migrateTable('stories');
        await migrateTable('blogs');
        await migrateTable('audio_stories');
        await migrateTable('audio_episodes');
        await migrateTable('books', 'book_library');
        await migrateTable('reviews');
        await migrateTable('chapter_ratings');
        await migrateTable('orders');
        await migrateTable('settings');
        await migrateTable('analytics');
        await migrateTable('subscribers');
        await migrateTable('categories');
        await migrateTable('notifications');
        // Add more as needed
        console.log('\nMigration Task Finished.');
        process.exit(0);
    } catch (err) {
        console.error('Migration crashed:', err);
        process.exit(1);
    }
};

run();
