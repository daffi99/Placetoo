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
    id: 'place-1790131354799',
    name: 'Asap Isep',
    category: 'coffee',
    lat: -6.841127,
    lng: 106.9243952,
    address: 'Kadudampit, Sukabumi, Jawa Barat, 43153, Indonesia',
    area: 'Kadudampit',
    priceRange: 'Rp 30–60 rb',
    rating: 4.8,
    reviewCount: 320,
    photoUrl: 'https://indonesia-az.com/wp-content/uploads/2024/08/Area-depan-Asap-Isep-1024x767.jpeg',
    threadsUrl: '',
    notes: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Asap+Isep+Kadudampit',
    isVisited: false,
    isFavorite: false,
    createdAt: 1790131354799,
  },
  {
    id: 'place-1790092927519',
    name: 'Kopi Sabuga',
    category: 'coffee',
    lat: -6.6037549,
    lng: 106.8017841,
    address: 'Gang Lbk Pasar, Babakan Pasar, Bogor Tengah, Bogor, Jawa Barat, 16126, Indonesia',
    area: 'Bogor',
    priceRange: '',
    rating: 4.7,
    reviewCount: 480,
    photoUrl: 'https://ugc.production.linktr.ee/ddfd7716-050e-42ea-ad71-6d9d5302b579_IMG-1522.jpeg?io=true&size=avatar-v3_0',
    threadsUrl: '',
    notes: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kopi+Sabuga+Bogor',
    isVisited: false,
    isFavorite: false,
    createdAt: 1790092927519,
  },
  {
    id: 'place-1790092749118',
    name: 'Mugi House',
    category: 'coffee',
    lat: -6.2358685,
    lng: 106.8049313,
    address: '4A, Jalan Kertanegara, Blok K, Selong, Kebayoran Baru, Jakarta Selatan, Daerah Khusus Ibukota Jakarta, 12180, Indonesia',
    area: 'Daerah Khusus Ibukota Jakarta',
    priceRange: '',
    rating: 4.8,
    reviewCount: 260,
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWnDYjzBiajlgvAZ94eW25F77Nga8YFY080PWBmV0gEfado8SRTxlKu4fw&s=10',
    threadsUrl: '',
    notes: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mugi+House+Jakarta',
    isVisited: false,
    isFavorite: false,
    createdAt: 1790092749118,
  },
  {
    id: 'place-1790092561370',
    name: 'Madaya Coffee',
    category: 'coffee',
    lat: -6.4735034,
    lng: 106.7283995,
    address: 'Jampang Kulon, Jampang, Kemang, Bogor, Jawa Barat, 16310, Indonesia',
    area: 'Kemang',
    priceRange: 'Rp 30–60 rb',
    rating: 4.9,
    reviewCount: 1374,
    photoUrl: 'https://tse2.mm.bing.net/th/id/OIP.AyqMogbDe-cOvuvem798WgHaNK?r=0&pid=Api',
    threadsUrl: '',
    notes: '',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Madaya+Coffee+Kemang+Bogor',
    isVisited: false,
    isFavorite: false,
    createdAt: 1790092561370,
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
