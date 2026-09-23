import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, DbPlaceRow } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sql = getDb();
  if (!sql) {
    // If DATABASE_URL is not set yet, return the 4 initial places gracefully
    const FALLBACK_PLACES = [
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

    return res.status(200).json({
      success: true,
      fromDb: false,
      message: 'DATABASE_URL environment variable is not configured yet. Using initial fallback.',
      places: FALLBACK_PLACES,
    });
  }

  try {
    // 1. GET: Fetch all places
    if (req.method === 'GET') {
      const rows: DbPlaceRow[] = await sql`
        SELECT 
          id, name, category, lat, lng, address, area,
          price_range AS "priceRange",
          rating,
          review_count AS "reviewCount",
          photo_url AS "photoUrl",
          threads_url AS "threadsUrl",
          notes,
          google_maps_url AS "googleMapsUrl",
          is_visited AS "isVisited",
          is_favorite AS "isFavorite",
          created_at AS "createdAt"
        FROM places
        ORDER BY created_at DESC;
      `;
      return res.status(200).json({ success: true, fromDb: true, places: rows });
    }

    // 2. POST: Insert new place
    if (req.method === 'POST') {
      const p = req.body;
      if (!p || !p.name || p.lat === undefined || p.lng === undefined) {
        return res.status(400).json({ error: 'Missing required place fields (name, lat, lng)' });
      }

      const id = p.id || `place-${Date.now()}`;
      const createdAt = p.createdAt || Date.now();

      await sql`
        INSERT INTO places (
          id, name, category, lat, lng, address, area,
          price_range, rating, review_count, photo_url,
          threads_url, notes, google_maps_url,
          is_visited, is_favorite, created_at
        ) VALUES (
          ${id},
          ${p.name},
          ${p.category || 'coffee'},
          ${p.lat},
          ${p.lng},
          ${p.address || null},
          ${p.area || null},
          ${p.priceRange || null},
          ${p.rating || null},
          ${p.reviewCount || null},
          ${p.photoUrl || null},
          ${p.threadsUrl || null},
          ${p.notes || null},
          ${p.googleMapsUrl || null},
          ${p.isVisited || false},
          ${p.isFavorite || false},
          ${createdAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          address = EXCLUDED.address,
          area = EXCLUDED.area,
          price_range = EXCLUDED.price_range,
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          photo_url = EXCLUDED.photo_url,
          threads_url = EXCLUDED.threads_url,
          notes = EXCLUDED.notes,
          google_maps_url = EXCLUDED.google_maps_url,
          is_visited = EXCLUDED.is_visited,
          is_favorite = EXCLUDED.is_favorite;
      `;

      return res.status(201).json({ success: true, id, message: 'Place saved successfully' });
    }

    // 3. PUT: Update place
    if (req.method === 'PUT') {
      const p = req.body;
      if (!p || !p.id) {
        return res.status(400).json({ error: 'Missing place id' });
      }

      await sql`
        UPDATE places SET
          name = ${p.name},
          category = ${p.category || 'coffee'},
          lat = ${p.lat},
          lng = ${p.lng},
          address = ${p.address || null},
          area = ${p.area || null},
          price_range = ${p.priceRange || null},
          rating = ${p.rating || null},
          review_count = ${p.reviewCount || null},
          photo_url = ${p.photoUrl || null},
          threads_url = ${p.threadsUrl || null},
          notes = ${p.notes || null},
          google_maps_url = ${p.googleMapsUrl || null},
          is_visited = ${p.isVisited || false},
          is_favorite = ${p.isFavorite || false}
        WHERE id = ${p.id};
      `;

      return res.status(200).json({ success: true, message: 'Place updated successfully' });
    }

    // 4. DELETE: Delete place
    if (req.method === 'DELETE') {
      const id = (req.query.id as string) || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing place id to delete' });
      }

      await sql`DELETE FROM places WHERE id = ${id};`;
      return res.status(200).json({ success: true, message: 'Place deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Database error in /api/places:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
