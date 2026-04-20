-- Qalamekahani MySQL DATABASE STRUCTURE MIGRATION --
-- FOR HOSTINGER BUSINESS PLAN (MySQL) --

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    otp VARCHAR(10),
    otp_expire DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,
    notifications_on BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    liked_stories JSON,
    saved_blogs JSON,
    saved_audios JSON,
    saved_images JSON,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Stories Table (Stories, Blogs, Articles)
CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    summary TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'published',
    language VARCHAR(50) DEFAULT 'Hindi',
    author VARCHAR(255) DEFAULT 'Sabirkhan Pathan',
    image VARCHAR(255),
    hashtags JSON,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    is_premium BOOLEAN DEFAULT FALSE,
    youtube_link VARCHAR(255),
    chapter_stats JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2.1 Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    excerpt TEXT,
    author VARCHAR(100) DEFAULT 'Admin',
    category VARCHAR(100),
    read_time VARCHAR(50),
    image VARCHAR(255),
    language VARCHAR(50) DEFAULT 'Hindi',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Audio Stories Table
CREATE TABLE IF NOT EXISTS audio_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    language VARCHAR(50) DEFAULT 'Hindi',
    author VARCHAR(255) DEFAULT 'Sabirkhan Pathan',
    image VARCHAR(255),
    audio_url VARCHAR(255),
    file_url VARCHAR(255), -- Same as audio_url for legacy support
    duration VARCHAR(50),
    views INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'published',
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3.1 Audio Episodes Table
CREATE TABLE IF NOT EXISTS audio_episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audio_story_id INT,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    duration VARCHAR(50),
    order_index INT DEFAULT 0,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_story_id) REFERENCES audio_stories(id) ON DELETE CASCADE
);

-- 4. Book Library Table
CREATE TABLE IF NOT EXISTS book_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    description TEXT,
    language VARCHAR(50) DEFAULT 'Hindi/Gujarati',
    buy_link VARCHAR(255),
    price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(255),
    item_id VARCHAR(255), -- Support both INT and UUID strings
    item_type VARCHAR(50), -- 'story', 'audio', 'book', 'episode'
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'approved',
    reply TEXT,
    admin_reply_name VARCHAR(255) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Orders/Payments Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    book_id VARCHAR(255),
    story_id VARCHAR(255),
    audio_id VARCHAR(255),
    book_title VARCHAR(255),
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'created', -- 'created', 'paid', 'pending', 'failed'
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) DEFAULT 'Qalamekahani',
    hero_title VARCHAR(255),
    hero_subtitle TEXT,
    hero_image VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    social_instagram VARCHAR(255),
    social_facebook VARCHAR(255),
    social_youtube VARCHAR(255),
    admin_profile_image VARCHAR(255),
    about_heading VARCHAR(255),
    about_short TEXT,
    about_long TEXT,
    about_image VARCHAR(255),
    story_categories JSON,
    audio_categories JSON,
    book_categories JSON,
    blog_categories JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Analytics/Views Tracking
CREATE TABLE IF NOT EXISTS views_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT,
    content_type ENUM('story', 'audio'),
    view_count INT DEFAULT 1,
    last_viewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. Image Gallery
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    image VARCHAR(255) NOT NULL,
    image_url VARCHAR(255), -- for backward compatibility
    category VARCHAR(100),
    downloads INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Chapter Ratings
CREATE TABLE IF NOT EXISTS chapter_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT,
    chapter_index INT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- 11. Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(255),
    visits INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
