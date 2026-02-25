const bcrypt = require('bcryptjs');
require('dotenv').config();
const supabase = require('./config/supabase');

async function createAdmin(email, password, name) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
        .from('users')
        .insert([{
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            is_verified: true
        }])
        .select();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Admin User Created Successfully:', data[0].email);
    }
}

// You can change these values
createAdmin('sabirkhanp646@gmail.com', 'admin786', 'Sabirkhan Pathan');
