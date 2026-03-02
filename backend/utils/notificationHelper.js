const { sendEmail } = require('./emailService');
const supabase = require('../config/supabase');

const sendEmailNotification = async (item, type) => {
    try {
        // 1. Get all users who have notifications turned ON
        const { data: users, error } = await supabase
            .from('users')
            .select('email, name')
            .eq('notifications_on', true);

        if (error) {
            console.error('Error fetching subscribers:', error);
            return;
        }

        if (!users || users.length === 0) {
            console.log(`[NOTIFICATION DEBUG] No subscribers found where notifications_on = true.`);
            return;
        }

        console.log(`[NOTIFICATION DEBUG] Found ${users.length} subscribers.`);
        const recipientList = users.map(u => u.email);
        console.log(`[NOTIFICATION DEBUG] Recipient List:`, recipientList);

        // 2. Prepare Email Content based on type
        const itemTitle = item.title;
        const itemDesc = item.summary || item.description || 'Check out our latest addition!';

        let itemImage = item.image || item.coverImage || '';
        const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/$/, '');

        // Ensure Image URL is absolute
        if (itemImage && !itemImage.startsWith('http')) {
            const cleanPath = itemImage.startsWith('/') ? itemImage.substring(1) : itemImage;
            itemImage = `${baseUrl}/${cleanPath}`;
        }

        const itemLink = `${baseUrl}/${type === 'story' ? 'story-detail.html' : type === 'book' ? 'book-detail.html' : type === 'audio' ? 'audio-detail.html' : 'blog-detail.html'}?id=${item.slug || item.id}`;
        const typeLabel = type === 'audio' ? 'Audio' : type.charAt(0).toUpperCase() + type.slice(1);

        await sendEmail({
            email: recipientList,
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

        console.log(`Notification sent to ${users.length} users for ${type}: ${itemTitle}`);

    } catch (err) {
        console.error('Notification System Error:', err);
    }
};

module.exports = { sendEmailNotification };
