-- ==========================================================
-- QALAMVERCE MASTER GALLERY MIGRATION (COMPLETE RECOVERY)
-- ==========================================================

CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    downloads INT DEFAULT 0,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE gallery;

INSERT INTO gallery (title, image, category, downloads, likes, created_at) VALUES 
('Book cover ', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775223241/qalamekahani/images/file-1775223238486.jpg', 'General', 0, 0, '2026-04-03 13:34:05'),
('Banyan Tree Well in a Golden Field (Inspired', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774804525/qalamekahani/images/file-1774804525417.jpg', 'General', 0, 0, '2026-03-29 17:15:33'),
('Forest / Nature', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775111191/qalamekahani/images/file-1775111191446.jpg', 'General', 0, 0, '2026-04-02 06:26:42'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048956/qalamekahani/images/file-1775048955568.jpg', 'General', 0, 0, '2026-04-01 13:09:20'),
(' Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048918/qalamekahani/images/file-1775048916960.jpg', 'General', 0, 0, '2026-04-01 13:08:42'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048895/qalamekahani/images/file-1775048894539.jpg', 'General', 0, 0, '2026-04-01 13:08:19'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048875/qalamekahani/images/file-1775048875214.jpg', 'General', 0, 0, '2026-04-01 13:08:00'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048853/qalamekahani/images/file-1775048852836.jpg', 'General', 0, 0, '2026-04-01 13:07:38'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048833/qalamekahani/images/file-1775048832829.jpg', 'General', 0, 0, '2026-04-01 13:07:18'),
(' Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048737/qalamekahani/images/file-1775048735515.jpg', 'General', 0, 0, '2026-04-01 13:05:41'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048714/qalamekahani/images/file-1775048712613.jpg', 'General', 0, 0, '2026-04-01 13:05:18'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048694/qalamekahani/images/file-1775048692744.jpg', 'General', 0, 0, '2026-04-01 13:04:58'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048674/qalamekahani/images/file-1775048672528.jpg', 'General', 0, 0, '2026-04-01 13:04:38'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048652/qalamekahani/images/file-1775048650746.jpg', 'General', 0, 0, '2026-04-01 13:04:16'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048598/qalamekahani/images/file-1775048597341.jpg', 'General', 0, 0, '2026-04-01 13:03:22'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775048576/qalamekahani/images/file-1775048575086.jpg', 'General', 0, 0, '2026-04-01 13:03:00'),
(' Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812328/qalamekahani/images/file-1774812327429.jpg', 'General', 0, 0, '2026-03-29 19:25:40'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812304/qalamekahani/images/file-1774812303496.jpg', 'General', 0, 0, '2026-03-29 19:25:16'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812271/qalamekahani/images/file-1774812270824.jpg', 'General', 0, 0, '2026-03-29 19:24:43'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812234/qalamekahani/images/file-1774812233101.jpg', 'General', 0, 0, '2026-03-29 19:24:03'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812178/qalamekahani/images/file-1774812178049.jpg', 'General', 0, 0, '2026-03-29 19:23:23'),
(' Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812140/qalamekahani/images/file-1774812139686.jpg', 'General', 0, 0, '2026-03-29 19:22:45'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812117/qalamekahani/images/file-1774812116035.jpg', 'General', 0, 0, '2026-03-29 19:22:21'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812086/qalamekahani/images/file-1774812086201.jpg', 'General', 0, 0, '2026-03-29 19:21:44'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812048/qalamekahani/images/file-1774812047499.jpg', 'General', 0, 0, '2026-03-29 19:20:55'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774812009/qalamekahani/images/file-1774812009042.jpg', 'General', 0, 0, '2026-03-29 19:20:16'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774807490/qalamekahani/images/file-1774807489585.jpg', 'General', 0, 0, '2026-03-29 18:05:01'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774807448/qalamekahani/images/file-1774807448056.jpg', 'General', 0, 0, '2026-03-29 18:04:16'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774807405/qalamekahani/images/file-1774807404703.jpg', 'General', 0, 0, '2026-03-29 18:03:30'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774807353/qalamekahani/images/file-1774807353430.jpg', 'General', 0, 0, '2026-03-29 18:02:37'),
('Classical Rural Village Life (Village Core)', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774807294/qalamekahani/images/file-1774807294268.jpg', 'General', 0, 0, '2026-03-29 18:01:42'),
('5', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775115185/qalamekahani/images/file-1775115184736.jpg', 'General', 0, 0, '2026-04-02 07:33:08'),
('હોન્ટેડ બસ ', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1773388025/qalamekahani/images/file-1773388024952.jpg', 'General', 1, 0, '2026-03-13 07:47:29'),
('Haunted Graveyard', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1773654459/qalamekahani/images/file-1773654458060.jpg', 'General', 0, 0, '2026-03-16 09:47:42'),
('Vehicle-20', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775298779/qalamekahani/images/file-1775298777094.jpg', 'General', 0, 0, '2026-04-04 10:33:03'),
('Vehicle-22', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775298836/qalamekahani/images/file-1775298834460.jpg', 'General', 0, 0, '2026-04-04 10:34:00'),
('Panihari', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775050948/qalamekahani/images/file-1775050948282.jpg', 'Character Design', 0, 0, '2026-04-01 13:42:35'),
('Vehicle-34', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775299238/qalamekahani/images/file-1775299236113.jpg', 'General', 0, 0, '2026-04-04 10:40:43'),
('20', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775115655/qalamekahani/images/file-1775115654924.jpg', 'General', 0, 0, '2026-04-02 07:41:04'),
('Female ', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774244791/qalamekahani/images/file-1774244791781.jpg', 'General', 0, 0, '2026-03-23 05:46:41'),
('College Student', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774800000/qalamekahani/images/file-1774800000412.jpg', 'Character Design', 0, 0, '2026-03-29 16:00:18'),
('Carnival fairground', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774283586/qalamekahani/images/file-1774283585783.jpg', 'Wallpaper', 0, 0, '2026-03-23 16:33:20'),
('City Auto Rickshaw Driver', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1773486445/qalamekahani/images/file-1773486444807.jpg', 'Character Design', 0, 0, '2026-03-14 11:07:29'),
('Thumbnail-67', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775359607/qalamekahani/images/file-1775359604699.jpg', 'General', 0, 0, '2026-04-05 03:26:57'),
('City Fashion Model', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1773486205/qalamekahani/images/file-1773486204873.jpg', 'Character Design', 0, 0, '2026-03-14 11:03:32'),
('Greensreen tiger', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1775699261/qalamekahani/images/file-1775699258947.jpg', 'General', 0, 0, '2026-04-09 01:48:03'),
('Young Village Boy', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1773499084/qalamekahani/images/file-1773499083702.jpg', 'Character Design', 0, 0, '2026-03-14 14:38:09'),
('Muscular Man with Chain', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774244657/qalamekahani/images/file-1774244657506.jpg', 'Character Design', 0, 0, '2026-03-23 05:44:24'),
('Character Kit: Blue & Red Salwar', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774783504/qalamekahani/images/file-1774783503637.jpg', 'Character Design', 0, 0, '2026-03-29 11:25:08'),
('Village Priest portrait', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774800638/qalamekahani/images/file-1774800637629.jpg', 'Character Design', 0, 0, '2026-03-29 16:10:56'),
('Turnaround: Indian Woman Saree', 'https://res.cloudinary.com/dpxdmxqmi/image/upload/v1774782760/qalamekahani/images/file-1774782759676.jpg', 'Character Design', 0, 0, '2026-03-29 11:12:44');
-- END OF CONSOLIDATED MISSION DATA (Recovered 100%)

