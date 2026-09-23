import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env or .env.local if present
dotenv.config();
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: DATABASE_URL is not set.');
  console.error('Please set DATABASE_URL in your .env or .env.local file:');
  console.error('DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"\n');
  process.exit(1);
}

const sql = neon(databaseUrl);

const INITIAL_PLACES = [
  {
    id: 'madaya-coffee-bogor',
    name: 'Madaya Coffee',
    category: 'coffee',
    lat: -6.494799,
    lng: 106.746199,
    address: 'Kawasan Zona Madina, Jl. Raya Parung No.KM 42, Jampang, Kemang',
    area: 'Kemang, Bogor',
    priceRange: 'Rp 25–50 rb',
    rating: 4.9,
    reviewCount: 1374,
    photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Tempatnya cozy banget semi-outdoor, recommended coba donat kampung sama es kopi madaya!',
    googleMapsUrl: 'https://maps.google.com/?q=-6.494799,106.746199',
    isVisited: false,
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'matcha-bae-blok-m',
    name: 'Matcha Bae',
    category: 'matcha',
    lat: -6.244365,
    lng: 106.798782,
    address: 'Jl. Gandaria 1 No.63, Kramat Pela, Kebayoran Baru',
    area: 'Blok M / Gandaria, Jaksel',
    priceRange: 'Rp 40–80 rb',
    rating: 4.8,
    reviewCount: 920,
    photoUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Istri pengin banget cobain Tama Matcha sama Burnt Cheesecake matcha-nya! Antriannya rame pas weekend.',
    googleMapsUrl: 'https://maps.google.com/?q=-6.244365,106.798782',
    isVisited: false,
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'scarletts-house-blok-m',
    name: "Scarlett's House",
    category: 'bakery',
    lat: -6.244912,
    lng: 106.802103,
    address: 'Jl. Sultan Hasanudin No.4, Melawai, Kebayoran Baru',
    area: 'Blok M, Jaksel',
    priceRange: 'Rp 50–120 rb',
    rating: 4.7,
    reviewCount: 2150,
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Viral di Threads: Poured Tiramisu & Peach Earl Grey Cake. Wajib book / datang lebih pagi.',
    googleMapsUrl: 'https://maps.google.com/?q=-6.244912,106.802103',
    isVisited: true,
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'feel-matcha-pim',
    name: 'Feel Matcha',
    category: 'matcha',
    lat: -6.265882,
    lng: 106.784534,
    address: 'Pondok Indah Mall Street Gallery Lt. 2',
    area: 'Pondok Indah, Jaksel',
    priceRange: 'Rp 35–70 rb',
    rating: 4.8,
    reviewCount: 1680,
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Matcha brulee latte & mille crepe matcha lezat pol!',
    googleMapsUrl: 'https://maps.google.com/?q=-6.265882,106.784534',
    isVisited: false,
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'titik-temu-senopati',
    name: 'Titik Temu Coffee',
    category: 'coffee',
    lat: -6.234125,
    lng: 106.812349,
    address: 'Jl. Senopati No.27, Senayan, Kebayoran Baru',
    area: 'Senopati, Jaksel',
    priceRange: 'Rp 45–90 rb',
    rating: 4.7,
    reviewCount: 3100,
    photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Kafenya adem, kopi susunya smooth, enak buat nongkrong sore di taman outdoor-nya.',
    googleMapsUrl: 'https://maps.google.com/?q=-6.234125,106.812349',
    isVisited: false,
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'braud-general-store-senopati',
    name: 'Braud General Store',
    category: 'resto',
    lat: -6.235921,
    lng: 106.809452,
    address: 'Jl. Senopati No.36, San Seno, Kebayoran Baru',
    area: 'Senopati, Jaksel',
    priceRange: 'Rp 80–200 rb',
    rating: 4.8,
    reviewCount: 840,
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Brunch cafe ala Melbourne, sourdough & truffle scrambled eggs-nya mantap banget.',
    googleMapsUrl: 'https://maps.google.com/?q=-6.235921,106.809452',
    isVisited: false,
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  }
];

async function migrate() {
  console.log('🚀 Connecting to Neon PostgreSQL...');

  try {
    console.log('📦 Creating table "places" if not exists...');
    await sql`
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
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
    `;

    console.log('✅ Table and indexes created successfully.');

    console.log('🌱 Seeding initial places...');
    let seededCount = 0;

    for (const place of INITIAL_PLACES) {
      await sql`
        INSERT INTO places (
          id, name, category, lat, lng, address, area,
          price_range, rating, review_count, photo_url,
          threads_url, notes, google_maps_url,
          is_visited, is_favorite, created_at
        ) VALUES (
          ${place.id},
          ${place.name},
          ${place.category},
          ${place.lat},
          ${place.lng},
          ${place.address},
          ${place.area},
          ${place.priceRange},
          ${place.rating},
          ${place.reviewCount},
          ${place.photoUrl},
          ${place.threadsUrl},
          ${place.notes},
          ${place.googleMapsUrl},
          ${place.isVisited},
          ${place.isFavorite},
          ${place.createdAt}
        )
        ON CONFLICT (id) DO NOTHING;
      `;
      seededCount++;
    }

    console.log(`✅ Seeding complete! Processed ${seededCount} initial places.`);
    console.log('\n🎉 Neon Database is ready for Placetoo!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
