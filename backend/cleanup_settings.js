const supabase = require('./config/supabase');

async function cleanupSettings() {
    console.log("Fetching all settings...");
    const { data: settings, error } = await supabase
        .from('settings')
        .select('id, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching settings:", error.message);
        return;
    }

    if (settings.length <= 1) {
        console.log(`Found ${settings.length} row(s). No cleanup needed.`);
        return;
    }

    console.log(`Found ${settings.length} rows. Keeping the oldest one and deleting the rest...`);

    const keepId = settings[0].id;
    const deleteIds = settings.slice(1).map(s => s.id);

    console.log(`Keeping ID: ${keepId}`);
    console.log(`Deleting IDs: ${deleteIds.join(', ')}`);

    const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .in('id', deleteIds);

    if (deleteError) {
        console.error("Error deleting extra settings:", deleteError.message);
    } else {
        console.log("Cleanup successful!");
    }
}

cleanupSettings();
