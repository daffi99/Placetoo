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
        googleMapsUrl: 'https://maps.google.com/?q=-6.841127,106.9243952',
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
        googleMapsUrl: 'https://maps.google.com/?q=-6.6037549,106.8017841',
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
        googleMapsUrl: 'https://maps.google.com/?q=-6.2358685,106.8049313',
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
        googleMapsUrl: 'https://maps.google.com/?q=-6.4735034,106.7283995',
        isVisited: false,
        isFavorite: false,
        createdAt: 1790092561370,
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
