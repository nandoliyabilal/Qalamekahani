const supabase = require('./config/supabase');

async function test() {
    console.log('Testing Supabase with DNS Override...');
    try {
        const { data, error } = await supabase.from('stories').select('id').limit(1);
        if (error) {
            console.error('Connection Failed:', error.message);
        } else {
            console.log('SUCCESS! Connection established. Data:', data);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
