const supabase = require('./config/supabase');

async function checkOrderSchema() {
    console.log("Checking 'orders' table schema...");

    // 1. Try to select story_id from orders (if column doesn't exist, this might not throw immediately unless we select specific column? or insert?)
    // Best way: Try to INSERT a dummy order with story_id that will fail constraints (e.g. invalid UUID) or succeed.
    // If column doesn't exist, it will say "column story_id of relation orders does not exist".

    console.log("Attempting dry-run insert to check 'story_id' column...");

    const dummyOrder = {
        amount: 100,
        currency: 'INR',
        status: 'test_schema_check',
        // We use a valid-looking UUID but one that hopefully matches nothing or satisfy FK if possible. 
        // Actually, if we just check if the column exists, we can try to update a non-existent row.
    };

    // Attempting update on non-existent row with story_id
    const { error } = await supabase
        .from('orders')
        .update({ story_id: '00000000-0000-0000-0000-000000000000' }) // Valid UUID format
        .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        console.log("Error during check:", error.message);
        if (error.message.includes('column "story_id" of relation "orders" does not exist')) {
            console.log("VERDICT: MISSING_COLUMN - You need to run the SQL script to add 'story_id' to the 'orders' table.");
        } else if (error.message.includes('relation "orders" does not exist')) {
            console.log("VERDICT: MISSING_TABLE - The 'orders' table does not exist at all.");
        } else {
            console.log("VERDICT: UNKNOWN_ERROR - " + error.message);
        }
    } else {
        console.log("VERDICT: COLUMN_EXISTS - The 'story_id' column appears to exist.");
    }
}

checkOrderSchema();
