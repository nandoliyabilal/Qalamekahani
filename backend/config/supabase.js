const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase Client Initialized (For Auth)');
    } catch (err) {
        console.error('❌ Supabase Initialization Failed:', err.message);
    }
} else {
    console.warn('⚠️ Supabase credentials missing. Google Login will not work.');
}

module.exports = supabase;
