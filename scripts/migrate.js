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
    id: 'asap-isep-kadudampit',
    name: 'Asap Isep',
    category: 'coffee',
    lat: -6.841127,
    lng: 106.926975,
    address: 'BumiBagja Food Forest, Desa Gede Pangrango, Kec. Kadudampit',
    area: 'Kadudampit',
    priceRange: 'Rp 30–60 rb',
    rating: 4.8,
    reviewCount: 320,
    photoUrl: 'https://tse4.mm.bing.net/th/id/OIP.vCcLW-KMqyUzPdE1MBQCpAAAAA?r=0&pid=Api',
    threadsUrl: 'https://www.instagram.com/asap_isep/',
    notes: 'Tempat ngopi syahdu di tengah hutan Kadudampit, adem dan asri banget.',
    googleMapsUrl: 'https://maps.google.com/?q=-6.841127,106.926975',
    isVisited: false,
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: 'kopi-sabuga-bogor',
    name: 'Kopi Sabuga',
    category: 'coffee',
    lat: -6.60417,
    lng: 106.80389,
    address: 'Jl. Bangka No.16, Baranangsiang, Kec. Bogor Timur',
    area: 'Bogor',
    priceRange: 'Rp 25–50 rb',
    rating: 4.7,
    reviewCount: 480,
    photoUrl: 'https://tse2.mm.bing.net/th/id/OIP.tjMDY_W2p2A1uHv62OH99gHaJQ?r=0&pid=Api',
    threadsUrl: 'https://www.instagram.com',
    notes: 'Kopi nikmat di tengah kota Bogor dengan suasana santai.',
    googleMapsUrl: 'https://maps.google.com/?q=Kopi+Sabuga+Jalan+Bangka+No.16+Bogor',
    isVisited: false,
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'mugi-house-jakarta',
    name: 'Mugi House',
    category: 'coffee',
    lat: -6.23667,
    lng: 106.80917,
    address: 'Jl. Gunawarman No.16, Selong, Kec. Kebayoran Baru',
    area: 'Daerah Khusus Ibukota Jakarta',
    priceRange: 'Rp 40–80 rb',
    rating: 4.8,
    reviewCount: 260,
    photoUrl: 'https://tse4.mm.bing.net/th/id/OIP.COC85r_6e4uuvYKVIh9PywHaNJ?r=0&pid=Api',
    threadsUrl: 'https://www.instagram.com',
    notes: 'Kafe aesthetic di area Gunawarman Jaksel.',
    googleMapsUrl: 'https://maps.google.com/?q=Mugi+House+Gunawarman+Jakarta',
    isVisited: false,
    isFavorite: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'madaya-coffee-kemang',
    name: 'Madaya Coffee',
    category: 'coffee',
    lat: -6.494799,
    lng: 106.746199,
    address: 'Kawasan Zona Madina, Jl. Raya Parung No.KM 42, Jampang, Kemang',
    area: 'Kemang',
    priceRange: 'Rp 30–60 rb',
    rating: 4.9,
    reviewCount: 1374,
    photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    threadsUrl: 'https://www.threads.net',
    notes: 'Tempatnya cozy banget semi-outdoor, recommended coba donat kampung sama es kopi madaya!',
    googleMapsUrl: 'https://maps.google.com/?q=-6.494799,106.746199',
    isVisited: false,
    isFavorite: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
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
