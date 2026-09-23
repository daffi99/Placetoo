-- ========================================================
-- PLACETOO DATABASE SCHEMA & INITIAL SEED (NEON POSTGRESQL)
-- ========================================================
-- Jalankan seluruh query ini di Neon Console -> SQL Editor.
-- ========================================================

-- 1. Buat Tabel "places" jika belum ada
CREATE TABLE IF NOT EXISTS places (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'coffee',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  area VARCHAR(255),
  price_range VARCHAR(100),
  rating NUMERIC(3, 1),
  review_count INTEGER,
  photo_url TEXT,
  threads_url TEXT,
  notes TEXT,
  google_maps_url TEXT,
  is_visited BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

-- 2. Buat Index untuk performa query sorting & filtering
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

-- 3. Seed data kafe awal (Idempotent: ON CONFLICT DO NOTHING)
INSERT INTO places (
  id, name, category, lat, lng, address, area,
  price_range, rating, review_count, photo_url,
  threads_url, notes, google_maps_url,
  is_visited, is_favorite, created_at
) VALUES 
(
  'madaya-coffee-bogor',
  'Madaya Coffee',
  'coffee',
  -6.494799,
  106.746199,
  'Kawasan Zona Madina, Jl. Raya Parung No.KM 42, Jampang, Kemang',
  'Kemang, Bogor',
  'Rp 25–50 rb',
  4.9,
  1374,
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Tempatnya cozy banget semi-outdoor, recommended coba donat kampung sama es kopi madaya!',
  'https://maps.google.com/?q=-6.494799,106.746199',
  FALSE,
  TRUE,
  1774320000000
),
(
  'matcha-bae-blok-m',
  'Matcha Bae',
  'matcha',
  -6.244365,
  106.798782,
  'Jl. Gandaria 1 No.63, Kramat Pela, Kebayoran Baru',
  'Blok M / Gandaria, Jaksel',
  'Rp 40–80 rb',
  4.8,
  920,
  'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Istri pengin banget cobain Tama Matcha sama Burnt Cheesecake matcha-nya! Antriannya rame pas weekend.',
  'https://maps.google.com/?q=-6.244365,106.798782',
  FALSE,
  TRUE,
  1774233600000
),
(
  'scarletts-house-blok-m',
  'Scarlett''s House',
  'bakery',
  -6.244912,
  106.802103,
  'Jl. Sultan Hasanudin No.4, Melawai, Kebayoran Baru',
  'Blok M, Jaksel',
  'Rp 50–120 rb',
  4.7,
  2150,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Viral di Threads: Poured Tiramisu & Peach Earl Grey Cake. Wajib book / datang lebih pagi.',
  'https://maps.google.com/?q=-6.244912,106.802103',
  TRUE,
  TRUE,
  1773888000000
),
(
  'feel-matcha-pim',
  'Feel Matcha',
  'matcha',
  -6.265882,
  106.784534,
  'Pondok Indah Mall Street Gallery Lt. 2',
  'Pondok Indah, Jaksel',
  'Rp 35–70 rb',
  4.8,
  1680,
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Matcha brulee latte & mille crepe matcha lezat pol!',
  'https://maps.google.com/?q=-6.265882,106.784534',
  FALSE,
  FALSE,
  1774060800000
),
(
  'titik-temu-senopati',
  'Titik Temu Coffee',
  'coffee',
  -6.234125,
  106.812349,
  'Jl. Senopati No.27, Senayan, Kebayoran Baru',
  'Senopati, Jaksel',
  'Rp 45–90 rb',
  4.7,
  3100,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Kafenya adem, kopi susunya smooth, enak buat nongkrong sore di taman outdoor-nya.',
  'https://maps.google.com/?q=-6.234125,106.812349',
  FALSE,
  FALSE,
  1773974400000
),
(
  'braud-general-store-senopati',
  'Braud General Store',
  'resto',
  -6.235921,
  106.809452,
  'Jl. Senopati No.36, San Seno, Kebayoran Baru',
  'Senopati, Jaksel',
  'Rp 80–200 rb',
  4.8,
  840,
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Brunch cafe ala Melbourne, sourdough & truffle scrambled eggs-nya mantap banget.',
  'https://maps.google.com/?q=-6.235921,106.809452',
  FALSE,
  TRUE,
  1773801600000
)
ON CONFLICT (id) DO NOTHING;
