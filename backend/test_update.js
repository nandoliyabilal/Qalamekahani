const supabase = require('./config/supabase'); // Uses existing config which has URL/KEY

async function testUpdate() {
    console.log("Fetching first story...");
    const { data: stories, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .limit(1);

    if (fetchError || !stories || stories.length === 0) {
        console.error("Error fetching stories:", fetchError);
        return;
    }

    const story = stories[0];
    console.log(`Testing with story: ${story.title} (ID: ${story.id})`);
    console.log(`Current Price: ${story.price}`);

    const newPrice = 99;
    console.log(`Attempting to update Price to ${newPrice}...`);

    const { data: updated, error: updateError } = await supabase
        .from('stories')
        .update({ price: newPrice, discount: 10 })
        .eq('id', story.id)
        .select()
        .single();

    if (updateError) {
        console.error("Update failed:", updateError.message);
    } else {
        console.log("Update successful!");
        console.log(`New Price in DB: ${updated.price}`);
        console.log(`New Discount in DB: ${updated.discount}`);

        if (updated.price == newPrice) {
            console.log("VERIFIED: Price was saved correctly.");
        } else {
            console.log("FAILED: Price returned from DB does not match.");
        }
    }
}

testUpdate();
