const asyncHandler = require('express-async-handler');
const db = require('../config/mysql_db');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount, bookId, bookTitle, storyId, storyTitle, audioId, audioTitle, customerDetails } = req.body;

    if (!amount || (!bookId && !storyId && !audioId)) {
        res.status(400);
        throw new Error('Please provide all required fields (amount and item ID)');
    }

    const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);

        // Save order to MySQL
        const insertData = {
            amount: amount,
            currency: 'INR',
            razorpay_order_id: order.id,
            status: 'created',
            customer_name: customerDetails?.name || 'Anonymous',
            customer_email: customerDetails?.email,
            customer_phone: customerDetails?.phone || '',
            book_title: bookTitle || storyTitle || audioTitle || 'Purchased Item',
            book_id: bookId || null,
            story_id: storyId || null,
            audio_id: audioId || null,
            user_id: req.user ? req.user.id : null
        };

        const columns = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = columns.map(() => '?').join(', ');

        await db.execute(
            `INSERT INTO orders (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );

        res.status(200).json({
            ...order,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('[ORDER] Create Order Error:', error);
        res.status(500);
        throw new Error(`Payment Initialization Failed: ${error.message}`);
    }
});

// @desc    Verify Razorpay Payment
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
        // Log success for debugging
        console.log(`✅ Payment successful for Order: ${razorpay_order_id}`);

        await db.execute(
            'UPDATE orders SET status = "paid", razorpay_payment_id = ? WHERE razorpay_order_id = ?',
            [razorpay_payment_id, razorpay_order_id]
        );

        // Get order details for email
        const [rows] = await db.execute('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id]);
        const orderData = rows[0];

        if (orderData) {
            try {
                await sendEmail({
                    email: orderData.customer_email,
                    subject: 'Payment Successful - Qalamekahani',
                    type: 'payment_success',
                    itemData: {
                        itemTitle: orderData.book_title || 'Item',
                        orderId: razorpay_order_id,
                        amount: orderData.amount,
                        itemUrl: process.env.FRONTEND_URL || 'https://qalamekahani.com'
                    }
                });
            } catch (e) {
                console.error('[ORDER] Success Email Error:', e);
            }
        }

        res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
    } else {
        res.status(400);
        throw new Error('Invalid signature');
    }
});

// @desc    Get all orders (Admin)
const getOrders = asyncHandler(async (req, res) => {
    const [orders] = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
    res.status(200).json(orders);
});

// @desc    Get my orders (User)
const getMyOrders = asyncHandler(async (req, res) => {
    // Attempt to match by user_id first, then email
    let query = 'SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC';
    const [orders] = await db.execute(query, [req.user.id, req.user.email]);
    res.status(200).json(orders);
});

// @desc    Cancel/Fail Payment Tracking
const cancelPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id } = req.body;

    const [rows] = await db.execute('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id]);
    const orderData = rows[0];

    if (!orderData) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (orderData.status !== 'paid') {
        await db.execute('UPDATE orders SET status = "pending" WHERE razorpay_order_id = ?', [razorpay_order_id]);

        try {
            await sendEmail({
                email: orderData.customer_email,
                subject: 'Payment Pending - Qalamekahani',
                type: 'payment_pending',
                itemData: {
                    itemTitle: orderData.book_title || 'Item',
                    orderId: razorpay_order_id,
                    amount: orderData.amount
                }
            });
        } catch (e) {
            console.error('[ORDER] Pending Email Error:', e);
        }
    }

    res.json({ success: true, message: 'Payment status updated to pending' });
});

module.exports = { getOrders, createRazorpayOrder, verifyPayment, getMyOrders, cancelPayment };
