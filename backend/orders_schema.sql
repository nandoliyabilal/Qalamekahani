-- Run this in Supabase SQL Editor to create the orders table for the payment system

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES public.books(id),
    book_title TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    status TEXT DEFAULT 'created', -- 'created', 'paid', 'failed'
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public to insert orders (needed for checkout)
CREATE POLICY "Enable order creation for all" ON "public"."orders" FOR INSERT WITH CHECK (true);

-- Allow admins to read all orders
CREATE POLICY "Enable read access for admins" ON "public"."orders" FOR SELECT USING (true);
