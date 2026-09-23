-- ========================================================
-- PLACETOO DATABASE SCHEMA & PINPOINT SEED (NEON POSTGRESQL)
-- ========================================================
-- Jalankan query ini di Neon Console -> SQL Editor.
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

-- 3. Update google_maps_url yang masih berupa koordinat mentah agar langsung pinpoint ke profil bisnis kafe
UPDATE places 
SET google_maps_url = 'https://www.google.com/maps/search/?api=1&query=' || REPLACE(name || ' ' || COALESCE(area, ''), ' ', '+')
WHERE google_maps_url LIKE '%?q=%' OR google_maps_url IS NULL;

-- 4. Masukkan / Update 4 kafe dengan direct business pinpoint
INSERT INTO places (
  id, name, category, lat, lng, address, area,
  price_range, rating, review_count, photo_url,
  threads_url, notes, google_maps_url,
  is_visited, is_favorite, created_at
) VALUES 
(
  'place-1790131354799',
  'Asap Isep',
  'coffee',
  -6.841127,
  106.9243952,
  'Kadudampit, Sukabumi, Jawa Barat, 43153, Indonesia',
  'Kadudampit',
  'Rp 30–60 rb',
  4.8,
  320,
  'https://indonesia-az.com/wp-content/uploads/2024/08/Area-depan-Asap-Isep-1024x767.jpeg',
  NULL,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Asap+Isep+Kadudampit',
  FALSE,
  FALSE,
  1790131354799
),
(
  'place-1790092927519',
  'Kopi Sabuga',
  'coffee',
  -6.6037549,
  106.8017841,
  'Gang Lbk Pasar, Babakan Pasar, Bogor Tengah, Bogor, Jawa Barat, 16126, Indonesia',
  'Bogor',
  NULL,
  4.7,
  480,
  'https://ugc.production.linktr.ee/ddfd7716-050e-42ea-ad71-6d9d5302b579_IMG-1522.jpeg?io=true&size=avatar-v3_0',
  NULL,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Kopi+Sabuga+Bogor',
  FALSE,
  FALSE,
  1790092927519
),
(
  'place-1790092749118',
  'Mugi House',
  'coffee',
  -6.2358685,
  106.8049313,
  '4A, Jalan Kertanegara, Blok K, Selong, Kebayoran Baru, Jakarta Selatan, Daerah Khusus Ibukota Jakarta, 12180, Indonesia',
  'Daerah Khusus Ibukota Jakarta',
  NULL,
  4.8,
  260,
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWnDYjzBiajlgvAZ94eW25F77Nga8YFY080PWBmV0gEfado8SRTxlKu4fw&s=10',
  NULL,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Mugi+House+Jakarta',
  FALSE,
  FALSE,
  1790092749118
),
(
  'place-1790092561370',
  'Madaya Coffee',
  'coffee',
  -6.4735034,
  106.7283995,
  'Jampang Kulon, Jampang, Kemang, Bogor, Jawa Barat, 16310, Indonesia',
  'Kemang',
  'Rp 30–60 rb',
  4.9,
  1374,
  'https://tse2.mm.bing.net/th/id/OIP.AyqMogbDe-cOvuvem798WgHaNK?r=0&pid=Api',
  NULL,
  NULL,
  'https://www.google.com/maps/search/?api=1&query=Madaya+Coffee+Kemang+Bogor',
  FALSE,
  FALSE,
  1790092561370
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  address = EXCLUDED.address,
  area = EXCLUDED.area,
  price_range = EXCLUDED.price_range,
  photo_url = EXCLUDED.photo_url,
  google_maps_url = EXCLUDED.google_maps_url;
