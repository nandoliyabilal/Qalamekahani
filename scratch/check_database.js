const db = require('../backend/config/mysql_db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkStats = async () => {
    try {
        console.log('--- Database Quick Stats ---');
        
        const [subscribers] = await db.execute('SELECT COUNT(*) as count FROM subscribers');
        console.log(`Newsletter Subscribers: ${subscribers[0].count}`);
        
        const [users] = await db.execute('SELECT COUNT(*) as count FROM users WHERE notifications_on = true');
        console.log(`Users with Notifications ON: ${users[0].count}`);
        
        const [orders] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
        console.log(`Pending Orders: ${orders[0].count}`);

        console.log('--- Recent Subscribers ---');
        const [recent] = await db.execute('SELECT * FROM subscribers ORDER BY id DESC LIMIT 5');
        console.table(recent);

        process.exit(0);
    } catch (err) {
        console.error('Database Check Failed:', err.message);
        process.exit(1);
    }
};

checkStats();
