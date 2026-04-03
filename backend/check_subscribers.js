const supabase = require('./config/supabase');

async function checkSubscribersTable() {
    console.log("Checking 'subscribers' table...");

    const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching subscribers:", error.message);
        console.log("Creating table might be needed or it's just empty.");
        // Try to insert a dummy to see if it fails
        const { error: insertError } = await supabase.from('subscribers').insert([{ email: 'test@example.com' }]);
        if (insertError) {
             console.log("INSERT FAILURE: ", insertError.message);
        } else {
             console.log("INSERT SUCCESS: Table exists and is functional.");
        }
    } else {
        console.log("Table 'subscribers' exists.");
    }
}

checkSubscribersTable();
