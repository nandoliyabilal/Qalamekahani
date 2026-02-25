const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key. Check path to .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAudio() {
    console.log('--- STARTING AUDIO DEBUG ---');
    console.log('Connecting to Supabase...');

    // 1. Fetch ALL Audio Stories
    const { data: allStories, error } = await supabase
        .from('audio_stories')
        .select('id, title, _id');

    if (error) {
        console.error('ERROR Fetching List:', error);
        return;
    }

    console.log(`Found ${allStories.length} audio stories.`);
    console.log('ID List:');
    allStories.forEach(s => {
        console.log(`- ID: '${s.id}' | Title: '${s.title}' | _id: '${s._id || "N/A"}'`);
    });

    // 2. Test Specific ID Fetch (The one from the screenshot)
    const targetId = '80da0517-015e-40e3-806a-bb6c845d3ea7';
    console.log(`\nTesting Fetch for Target ID: '${targetId}'`);

    const { data: single, error: singleErr } = await supabase
        .from('audio_stories')
        .select('*')
        .eq('id', targetId)
        .single();

    if (singleErr) {
        console.error('Fetch Result: ERROR', singleErr.message, singleErr.code);
    } else {
        console.log('Fetch Result: SUCCESS', single ? 'Found' : 'Null');
    }

    // 3. Test Type of ID in memory
    const match = allStories.find(s => s.id == targetId);
    if (match) {
        console.log('\nIn-Memory Match Found!');
        console.log('Type of s.id:', typeof match.id);
        console.log('Value:', match.id);
        console.log('Strict Equality check:', match.id === targetId);
    } else {
        console.log('\nIn-Memory Match NOT Found.');
        // Try fuzzy match
        const fuzzy = allStories.find(s => s.id.trim() == targetId.trim());
        if (fuzzy) {
            console.log(`\nFuzzy In-Memory Match Found! But direct failed?`);
            console.log(`DB ID: '${fuzzy.id}' vs Target: '${targetId}'`);
        }
    }
}

debugAudio();
