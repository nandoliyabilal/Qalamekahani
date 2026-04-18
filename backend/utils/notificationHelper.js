const { sendEmail } = require('./emailService');
const db = require('../config/mysql_db');

const sendEmailNotification = async (item, type) => {
    try {
        // 1. Get all users who have notifications turned ON in MySQL
        const [users] = await db.execute('SELECT email FROM users WHERE notifications_on = true');

        // 2. Get all newsletter subscribers in MySQL
        const [subscribers] = await db.execute('SELECT email FROM subscribers');

        // Combine and unique list of emails
        const emailSet = new Set();
        users.forEach(u => emailSet.add(u.email));
        subscribers.forEach(s => emailSet.add(s.email));

        const recipientList = Array.from(emailSet);

        if (recipientList.length === 0) {
            console.log(`[NOTIFICATION DEBUG] No subscribers found.`);
            return;
        }

        // 3. Prepare Email Content
        const itemTitle = item.title;
        const itemDesc = item.summary || item.description || 'Check out our latest addition!';

        let itemImage = item.image || item.coverImage || '';
        const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/$/, '');

        // Ensure Image URL is absolute
        if (itemImage && !itemImage.startsWith('http')) {
            const cleanPath = itemImage.startsWith('/') ? itemImage.substring(1) : itemImage;
            itemImage = `${baseUrl}/${cleanPath}`;
        }

        const paramName = type === 'blog' ? 'slug' : 'id';
        const paramValue = item.slug || item.id;
        const pageName = type === 'story' ? 'story-detail.html' : type === 'book' ? 'book-detail.html' : type === 'audio' ? 'audio-detail.html' : 'blog-detail.html';
        const itemLink = `${baseUrl}/${pageName}?${paramName}=${paramValue}`;
        const typeLabel = type === 'audio' ? 'Audio' : type.charAt(0).toUpperCase() + type.slice(1);

        console.log(`[NOTIFICATION] Sending emails for ${typeLabel} to ${recipientList.length} recipients...`);

        for (const recipient of recipientList) {
            try {
                await sendEmail({
                    email: recipient,
                    subject: `New ${typeLabel} Added: ${itemTitle}`,
                    type: 'new_item',
                    itemData: {
                        title: itemTitle,
                        summary: itemDesc,
                        image: itemImage,
                        link: itemLink,
                        typeLabel
                    }
                });
            } catch (err) {
                console.warn(`[NOTIFICATION] Failed for ${recipient}:`, err.message);
            }
        }

    } catch (err) {
        console.error('Notification System Fatal Error:', err);
    }
};

module.exports = { sendEmailNotification };
