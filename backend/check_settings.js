const supabase = require('./config/supabase');

async function checkSettings() {
    console.log("Checking settings table...");
    const { data: settings, error } = await supabase
        .from('settings')
        .select('*');

    if (error) {
        console.error("Error fetching settings:", error.message);
        return;
    }

    console.log(`Found ${settings.length} rows in settings table.`);
    if (settings.length > 0) {
        console.log("Settings rows:", JSON.stringify(settings, null, 2));
    } else {
        console.log("No settings found. Creating one...");
        const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert([{}])
            .select();
        if (insertError) {
            console.error("Error creating default settings:", insertError.message);
        } else {
            console.log("Default settings created:", newSettings);
        }
    }
}

checkSettings();
