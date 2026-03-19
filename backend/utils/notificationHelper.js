const { sendEmail } = require('./emailService');
const supabase = require('../config/supabase');

const sendEmailNotification = async (item, type) => {
    try {
        // 1. Get all users who have notifications turned ON
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('notifications_on', true);

        // 2. Get all newsletter subscribers
        const { data: subscribers, error: subError } = await supabase
            .from('subscribers')
            .select('email');

        if (userError || subError) {
            console.error('Error fetching subscribers:', userError || subError);
            return;
        }

        // Combine and unique list of emails
        const emailSet = new Set();
        if (users) users.forEach(u => emailSet.add(u.email));
        if (subscribers) subscribers.forEach(s => emailSet.add(s.email));

        const recipientList = Array.from(emailSet);

        if (recipientList.length === 0) {
            console.log(`[NOTIFICATION DEBUG] No subscribers found.`);
            return;
        }

        console.log(`[NOTIFICATION DEBUG] Found ${recipientList.length} unique subscribers.`);
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

        const paramName = type === 'blog' ? 'slug' : 'id';
        const paramValue = item.slug || item.id;
        const pageName = type === 'story' ? 'story-detail.html' : type === 'book' ? 'book-detail.html' : type === 'audio' ? 'audio-detail.html' : 'blog-detail.html';
        const itemLink = `${baseUrl}/${pageName}?${paramName}=${paramValue}`;
        const typeLabel = type === 'audio' ? 'Audio' : type.charAt(0).toUpperCase() + type.slice(1);

        console.log(`[NOTIFICATION] Starting notifications for ${recipientList.length} recipients...`);

        // Send to each recipient individually to avoid batch failure in Sandbox mode
        let successCount = 0;
        let failCount = 0;

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
                successCount++;
            } catch (err) {
                console.warn(`[NOTIFICATION] Failed for ${recipient}:`, err.message);
                failCount++;
            }
        }

        console.log(`[NOTIFICATION DONE] Success: ${successCount}, Failed: ${failCount}`);

    } catch (err) {
        console.error('Notification System Fatal Error:', err);
    }
};

module.exports = { sendEmailNotification };
