require('dotenv').config();
const supabase = require('./config/supabase');

async function verifyUser() {
    const email = 'bilalnandoliya60@gmail.com';
    const { data, error } = await supabase
        .from('users')
        .update({ is_verified: true, otp: null, otp_expire: null })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error verifying user:', error.message);
    } else {
        console.log('User verified successfully:', data[0].email);
    }
}

verifyUser();
