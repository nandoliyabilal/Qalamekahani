require('dotenv').config();
const supabase = require('./config/supabase');

async function checkUser() {
    const email = 'bilalnandoliya60@gmail.com';
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error.message);
        return;
    }

    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
}

checkUser();
