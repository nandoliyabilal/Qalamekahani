const supabase = require('./config/supabase');

async function checkColumns() {
    console.log("Checking 'stories' table columns...");

    // Try to insert a dummy story with price/discount to see if it errors or ignores
    // actually, easiest way is to select one story and check keys
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching stories:", error.message);
        return;
    }

    if (data && data.length > 0) {
        const story = data[0];
        console.log("Keys in fetched story:", Object.keys(story));
        if ('price' in story && 'discount' in story) {
            console.log("SUCCESS: 'price' and 'discount' columns EXIST.");
        } else {
            console.log("FAILURE: 'price' or 'discount' columns are MISSING.");
            console.log("Please run the SQL script in Supabase SQL Editor.");
        }
    } else {
        console.log("No stories found to check schema. Attempting dry-run update...");
        // Fallback: try to update a non-existent ID
        const { error: updateError } = await supabase
            .from('stories')
            .update({ price: 10 })
            .eq('id', '00000000-0000-0000-0000-000000000000');

        if (updateError && updateError.message.includes("column")) {
            console.log("FAILURE: Column likely missing based on error:", updateError.message);
        } else {
            console.log("Update check inconclusive (no error usually means columns might match or relaxed schema).");
        }
    }
}

checkColumns();
