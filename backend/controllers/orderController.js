const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/orders/create
// @access  Public
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount, bookId, bookTitle, storyId, storyTitle, audioId, audioTitle, customerDetails } = req.body;

    console.log("createRazorpayOrder Request Body:", req.body);
    console.log(`Processing Order - Amount: ${amount}, StoryId: ${storyId}, BookId: ${bookId}, AudioId: ${audioId}`);

    if (!amount || (!bookId && !storyId && !audioId)) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log("Razorpay Order Created. ID:", order.id);

        // Save order to Supabase with 'created' status
        const insertData = {
            amount: amount,
            currency: 'INR',
            razorpay_order_id: order.id,
            status: 'created',
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone,
            book_title: bookTitle || storyTitle || audioTitle // Store title in existing column
        };

        if (bookId) {
            insertData.book_id = bookId;
        }
        if (storyId) {
            insertData.story_id = storyId;
        }
        if (audioId) {
            insertData.audio_id = audioId;
        }

        console.log("Supabase Insert Payload:", insertData);

        const { data, error } = await supabase
            .from('orders')
            .insert([insertData]);

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw new Error(error.message);
        }

        res.status(200).json({
            ...order,
            key: process.env.RAZORPAY_KEY_ID // Send Key ID to frontend
        });
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});

// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
        // Payment verified - Update order status in Supabase
        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'paid',
                razorpay_payment_id: razorpay_payment_id
            })
            .eq('razorpay_order_id', razorpay_order_id);

        if (error) {
            res.status(500);
            throw new Error(error.message);
        }

        // Get order details for email
        const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('razorpay_order_id', razorpay_order_id)
            .single();

        if (orderData) {
            try {
                await sendEmail({
                    email: orderData.customer_email,
                    subject: 'Payment Successful - QalamVerse',
                    type: 'payment_success',
                    itemData: {
                        itemTitle: orderData.book_title || 'Item',
                        orderId: razorpay_order_id,
                        amount: orderData.amount,
                        itemUrl: process.env.FRONTEND_URL || 'https://qalamverse.com'
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
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    res.status(200).json(data);
});

// @desc    Get my orders (User)
// @route   GET /api/orders/mine
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    // We can use email or user_id (if we had it, but currently we save customer_email)
    const { data, error } = await supabase
        .from('orders')
        .select('*, story:story_id(id, title), book:book_id(id, title), audio:audio_id(id, title)')
        .eq('customer_email', req.user.email)
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500);
        throw new Error(error.message);
    }

    res.status(200).json(data);
});

// @desc    Cancel/Fail Payment Tracking
// @route   POST /api/orders/cancel
// @access  Public
const cancelPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id } = req.body;

    const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();

    if (fetchError || !orderData) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Only update if not already paid
    if (orderData.status !== 'paid') {
        await supabase
            .from('orders')
            .update({ status: 'pending' })
            .eq('razorpay_order_id', razorpay_order_id);

        try {
            await sendEmail({
                email: orderData.customer_email,
                subject: 'Payment Pending - QalamVerse',
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
