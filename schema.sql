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

-- 2. Buat Index untuk performa sorting & filtering
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);

-- 3. Seed 4 data tempat sesuai screenshot (Asap Isep, Kopi Sabuga, Mugi House, Madaya Coffee)
INSERT INTO places (
  id, name, category, lat, lng, address, area,
  price_range, rating, review_count, photo_url,
  threads_url, notes, google_maps_url,
  is_visited, is_favorite, created_at
) VALUES 
(
  'asap-isep-kadudampit',
  'Asap Isep',
  'coffee',
  -6.841127,
  106.926975,
  'BumiBagja Food Forest, Desa Gede Pangrango, Kec. Kadudampit',
  'Kadudampit',
  'Rp 30–60 rb',
  4.8,
  320,
  'https://tse4.mm.bing.net/th/id/OIP.vCcLW-KMqyUzPdE1MBQCpAAAAA?r=0&pid=Api',
  'https://www.instagram.com/asap_isep/',
  'Tempat ngopi syahdu di tengah hutan Kadudampit, adem dan asri banget.',
  'https://maps.google.com/?q=-6.841127,106.926975',
  FALSE,
  FALSE,
  1774320000000
),
(
  'kopi-sabuga-bogor',
  'Kopi Sabuga',
  'coffee',
  -6.60417,
  106.80389,
  'Jl. Bangka No.16, Baranangsiang, Kec. Bogor Timur',
  'Bogor',
  'Rp 25–50 rb',
  4.7,
  480,
  'https://tse2.mm.bing.net/th/id/OIP.tjMDY_W2p2A1uHv62OH99gHaJQ?r=0&pid=Api',
  'https://www.instagram.com',
  'Kopi nikmat di tengah kota Bogor dengan suasana santai.',
  'https://maps.google.com/?q=Kopi+Sabuga+Jalan+Bangka+No.16+Bogor',
  FALSE,
  FALSE,
  1774233600000
),
(
  'mugi-house-jakarta',
  'Mugi House',
  'coffee',
  -6.23667,
  106.80917,
  'Jl. Gunawarman No.16, Selong, Kec. Kebayoran Baru',
  'Daerah Khusus Ibukota Jakarta',
  'Rp 40–80 rb',
  4.8,
  260,
  'https://tse4.mm.bing.net/th/id/OIP.COC85r_6e4uuvYKVIh9PywHaNJ?r=0&pid=Api',
  'https://www.instagram.com',
  'Kafe aesthetic di area Gunawarman Jaksel.',
  'https://maps.google.com/?q=Mugi+House+Gunawarman+Jakarta',
  FALSE,
  FALSE,
  1774147200000
),
(
  'madaya-coffee-kemang',
  'Madaya Coffee',
  'coffee',
  -6.494799,
  106.746199,
  'Kawasan Zona Madina, Jl. Raya Parung No.KM 42, Jampang, Kemang',
  'Kemang',
  'Rp 30–60 rb',
  4.9,
  1374,
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
  'https://www.threads.net',
  'Tempatnya cozy banget semi-outdoor, recommended coba donat kampung sama es kopi madaya!',
  'https://maps.google.com/?q=-6.494799,106.746199',
  FALSE,
  TRUE,
  1774060800000
)
ON CONFLICT (id) DO NOTHING;
