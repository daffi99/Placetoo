import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

// Anti-Listicle Filter: Discard generic blog roundups unless they explicitly mention the place name
const LISTICLE_REGEX =
  /\b\d+\s*(cafe|coffee|rekomendasi|tempat|kedai|spot|pilihan|wisata|kuliner)\b|\brekomendasi\s+\d+|\bdaftar\s+\d+|\bterbaik di\b|\bhits di\b|\bviral di\b|\bpaling hits\b/i;

function cleanSearchQuery(query: string): string {
  return query
    .replace(/\s+(cafe|indonesia)\s*$/gi, '')
    .trim();
}

// 1. DuckDuckGo Social & Culinary Filter (Instagram, PergiKuliner, Manual Jakarta, TikTok, Linktree)
async function searchDdgSocialImages(query: string, limit = 18) {
  const cleanQ = cleanSearchQuery(query);
  const quoted = cleanQ.includes('"') ? cleanQ : `"${cleanQ}"`;
  const socialQuery = `${quoted} (site:instagram.com OR site:pergikuliner.com OR site:manual.co.id OR site:tiktok.com OR site:linktr.ee)`;

  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(socialQuery)}&kl=id-id`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=id-id&kl=id-id&o=json&q=${encodeURIComponent(socialQuery)}&vqd=${vqd}&f=,,,`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://duckduckgo.com/',
        },
      }
    );
    const json = await imgRes.json();
    const list = json.results || [];

    const queryKeywords = cleanQ
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    return list
      .filter((item: any) => {
        const title = (item.title || '').toLowerCase();
        const mentionsPlace = queryKeywords.some((k) => title.includes(k));
        const isListicle = LISTICLE_REGEX.test(title);
        return !(isListicle && !mentionsPlace);
      })
      .slice(0, limit)
      .map((item: any) => {
        // Lookaside Instagram URLs are HTML redirect pages, use fast and reliable CDN thumbnail
        const isLookaside = item.image && item.image.includes('lookaside.instagram.com');
        return {
          title: item.title,
          thumbnail: item.thumbnail,
          imageUrl: isLookaside ? item.thumbnail : item.image || item.thumbnail,
        };
      });
  } catch (err) {
    console.warn('DDG Social search failed', err);
    return [];
  }
}

// 2. DuckDuckGo General Image Fallback
async function searchDdgImages(query: string, limit = 18) {
  const cleanQ = cleanSearchQuery(query);
  const quoted = cleanQ.includes('"') ? cleanQ : `"${cleanQ}"`;

  try {
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(quoted)}&kl=id-id`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=id-id&kl=id-id&o=json&q=${encodeURIComponent(quoted)}&vqd=${vqd}&f=,,,`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://duckduckgo.com/',
        },
      }
    );
    const json = await imgRes.json();
    const queryKeywords = cleanQ
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const rawList = json.results || [];
    return rawList
      .filter((item: any) => {
        const title = (item.title || '').toLowerCase();
        const mentionsPlace = queryKeywords.some((k) => title.includes(k));
        const isListicle = LISTICLE_REGEX.test(title);
        return !(isListicle && !mentionsPlace);
      })
      .slice(0, limit)
      .map((item: any) => {
        const isLookaside = item.image && item.image.includes('lookaside.instagram.com');
        return {
          title: item.title,
          thumbnail: item.thumbnail,
          imageUrl: isLookaside ? item.thumbnail : item.image || item.thumbnail,
        };
      });
  } catch {
    return [];
  }
}

// 3. Bing Image Search Fallback
async function searchBingImages(query: string, limit = 18) {
  const cleanQ = cleanSearchQuery(query);
  const quoted = cleanQ.includes('"') ? cleanQ : `"${cleanQ}"`;

  let url = `https://www.bing.com/images/search?q=${encodeURIComponent(quoted)}&FORM=HDRSC2`;
  let res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    },
  });
  let html = await res.text();
  let matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];

  const queryKeywords = cleanQ
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: any[] = [];
  for (let i = 0; i < matches.length; i++) {
    try {
      const rawJson = matches[i][1].replace(/&quot;/g, '"');
      const parsed = JSON.parse(rawJson);
      if (!parsed.murl) continue;

      const title = parsed.t ? parsed.t.replace(/&amp;/g, '&') : cleanQ;
      const lowerTitle = title.toLowerCase();

      const mentionsPlace = queryKeywords.some((k) => lowerTitle.includes(k));
      const isListicle = LISTICLE_REGEX.test(lowerTitle);

      if (isListicle && !mentionsPlace) {
        continue;
      }

      results.push({
        title,
        thumbnail: (parsed.turl || parsed.murl).replace(/&amp;/g, '&'),
        imageUrl: parsed.murl,
      });

      if (results.length >= limit) break;
    } catch {}
  }

  return results;
}

let inMemoryPlaces: any[] = [
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

function mapsResolverPlugin(): Plugin {
  return {
    name: 'maps-resolver-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. Google Maps Shortlink Resolver
        if (req.url && req.url.startsWith('/api/resolve-maps')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }

          try {
            let currentUrl = targetUrl;
            let finalUrl = targetUrl;

            // Follow redirects manually without browser User-Agent
            for (let i = 0; i < 6; i++) {
              const response = await fetch(currentUrl, {
                redirect: 'manual',
              });

              const loc = response.headers.get('location');
              if (loc) {
                currentUrl = loc.startsWith('http') ? loc : new URL(loc, currentUrl).toString();
                finalUrl = currentUrl;
              } else {
                break;
              }
            }

            // 1. Extract place name
            let name = '';
            let address = '';
            let area = '';

            // Pattern A: Standard desktop /maps/place/Name/@lat,lng
            const placeMatch = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
            if (placeMatch && placeMatch[1]) {
              try {
                name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
              } catch {
                name = placeMatch[1].replace(/\+/g, ' ');
              }
            }

            // Pattern B: Mobile app share /maps?q=Place+Name,+Street+Address...
            let rawQ = '';
            try {
              const parsedUrl = new URL(finalUrl);
              rawQ = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '';
            } catch {
              const qMatch = finalUrl.match(/[?&](?:q|query)=([^&]+)/);
              if (qMatch) {
                try {
                  rawQ = decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
                } catch {
                  rawQ = qMatch[1].replace(/\+/g, ' ');
                }
              }
            }

            if (rawQ) {
              if (!/^-?\d+\.\d+[,\s]+-?\d+\.\d+$/.test(rawQ.trim())) {
                const parts = rawQ.split(',').map((s) => s.trim());
                if (!name && parts.length > 0 && parts[0]) {
                  name = parts[0];
                }
                address = rawQ;

                let district = '';
                let city = '';
                for (let i = 1; i < parts.length; i++) {
                  const p = parts[i];
                  if (/^(kecamatan|kec\.)\b/i.test(p)) {
                    district = p.replace(/^(kecamatan|kec\.)\s*/i, '').trim();
                  } else if (/^(kota|kabupaten|kab\.)\b/i.test(p)) {
                    city = p.replace(/^(kota|kabupaten|kab\.)\s*/i, '').trim();
                  } else if (!district && i === 2) {
                    district = p;
                  } else if (
                    !city &&
                    (p.includes('Depok') ||
                      p.includes('Bogor') ||
                      p.includes('Jakarta') ||
                      p.includes('Bandung') ||
                      p.includes('Tangerang') ||
                      p.includes('Bekasi') ||
                      p.includes('Jawa'))
                  ) {
                    city = p.replace(/\d+/g, '').trim();
                  }
                }

                if (district && city) {
                  area = `${district}, ${city}`;
                } else {
                  area = district || city || (parts.length > 2 ? parts[2] : parts[1] || '');
                }
              }
            }

            // 2. Extract coordinates: either @lat,lng, !3dlat!4dlng, or ?q=lat,lng
            let lat: number | null = null;
            let lng: number | null = null;

            const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) {
              lat = parseFloat(atMatch[1]);
              lng = parseFloat(atMatch[2]);
            } else {
              const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
              if (dataMatch) {
                lat = parseFloat(dataMatch[1]);
                lng = parseFloat(dataMatch[2]);
              } else {
                const qCoordMatch = finalUrl.match(/[?&](?:q|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (qCoordMatch) {
                  lat = parseFloat(qCoordMatch[1]);
                  lng = parseFloat(qCoordMatch[2]);
                }
              }
            }

            // 3. Fallback geocoding if coordinates not directly in URL
            if ((lat === null || lng === null) && rawQ) {
              const parts = rawQ.split(',').map((s) => s.trim());
              const placeName = parts[0];

              let cleanStreet = '';
              let district = '';
              let city = '';

              for (let i = 1; i < parts.length; i++) {
                const p = parts[i];
                if (/^(jl|jalan)\b/i.test(p)) {
                  cleanStreet = p.replace(/No\.\s*\d+[a-zA-Z]?/i, '').trim();
                } else if (/^(kecamatan|kec\.)\b/i.test(p)) {
                  district = p.replace(/^(kecamatan|kec\.)\s*/i, '').trim();
                } else if (/^(kota|kabupaten|kab\.)\b/i.test(p)) {
                  city = p.replace(/^(kota|kabupaten|kab\.)\s*/i, '').trim();
                } else if (!district && i === 2) {
                  district = p;
                } else if (
                  !city &&
                  (p.includes('Depok') ||
                    p.includes('Bogor') ||
                    p.includes('Jakarta') ||
                    p.includes('Bandung') ||
                    p.includes('Tangerang') ||
                    p.includes('Bekasi') ||
                    p.includes('Jawa'))
                ) {
                  city = p.replace(/\d+/g, '').trim();
                }
              }

              const queriesToTry = [
                `${placeName} ${city || district}`.trim(),
                `${cleanStreet}, ${district}, ${city}`.replace(/^,\s*|,\s*$/g, '').trim(),
                `${cleanStreet}, ${city}`.replace(/^,\s*|,\s*$/g, '').trim(),
                `${cleanStreet}, ${district}`.replace(/^,\s*|,\s*$/g, '').trim(),
                `${district}, ${city}`.replace(/^,\s*|,\s*$/g, '').trim(),
                city.trim(),
              ].filter((q) => q.length > 3);

              for (const query of queriesToTry) {
                try {
                  const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                      query
                    )}&limit=1`,
                    { headers: { 'User-Agent': 'PlacetooApp/1.0 (contact@placetoo.app)' } }
                  );
                  if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                      lat = parseFloat(geoData[0].lat);
                      lng = parseFloat(geoData[0].lon);
                      break;
                    }
                  }
                } catch {
                  // Continue to next query
                }
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                finalUrl,
                name: name || undefined,
                address: address || undefined,
                area: area || undefined,
                lat: lat !== null ? lat : undefined,
                lng: lng !== null ? lng : undefined,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 2. Multi-Tier Image Search (Bing -> DDG)
        if (req.url && req.url.startsWith('/api/search-images')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const query = urlObj.searchParams.get('q');
          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query parameter q' }));
            return;
          }

          try {
            const limitParam = parseInt(urlObj.searchParams.get('limit') || '16', 10);
            
            // 1. Primary: DuckDuckGo Social & Culinary Filter (Instagram, PergiKuliner, Manual Jakarta, TikTok)
            let images = await searchDdgSocialImages(query, limitParam);

            // 2. Fallback: DuckDuckGo General Images if fewer than 4 results
            if (!images || images.length < 4) {
              const generalDdg = await searchDdgImages(query, limitParam);
              const existingUrls = new Set(images.map((img: any) => img.imageUrl));
              for (const item of generalDdg) {
                if (!existingUrls.has(item.imageUrl)) {
                  images.push(item);
                  existingUrls.add(item.imageUrl);
                }
              }
            }

            // 3. Last fallback: Bing Images
            if (!images || images.length === 0) {
              images = await searchBingImages(query, limitParam);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, results: images }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, results: [] }));
          }
          return;
        }

        // 3. Places CRUD API for Local Development
        if (req.url && (req.url === '/api/places' || req.url.startsWith('/api/places?') || req.url.startsWith('/api/places/'))) {
          res.setHeader('Content-Type', 'application/json');
          const dbUrl = process.env.DATABASE_URL;
          const sql = dbUrl ? neon(dbUrl) : null;

          // Helper to read body
          const readJsonBody = (): Promise<any> => {
            return new Promise((resolve) => {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch {
                  resolve({});
                }
              });
            });
          };

          try {
            // GET
            if (req.method === 'GET') {
              if (sql) {
                const rows = await sql`
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
                res.end(JSON.stringify({ success: true, fromDb: true, places: rows }));
                return;
              } else {
                res.end(JSON.stringify({ success: true, fromDb: false, places: inMemoryPlaces }));
                return;
              }
            }

            // POST
            if (req.method === 'POST') {
              const p = await readJsonBody();
              const id = p.id || `place-${Date.now()}`;
              const createdAt = p.createdAt || Date.now();

              if (sql) {
                await sql`
                  INSERT INTO places (
                    id, name, category, lat, lng, address, area,
                    price_range, rating, review_count, photo_url,
                    threads_url, notes, google_maps_url,
                    is_visited, is_favorite, created_at
                  ) VALUES (
                    ${id}, ${p.name}, ${p.category || 'coffee'}, ${p.lat}, ${p.lng},
                    ${p.address || null}, ${p.area || null}, ${p.priceRange || null},
                    ${p.rating || null}, ${p.reviewCount || null}, ${p.photoUrl || null},
                    ${p.threadsUrl || null}, ${p.notes || null}, ${p.googleMapsUrl || null},
                    ${p.isVisited || false}, ${p.isFavorite || false}, ${createdAt}
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
              } else {
                inMemoryPlaces = [
                  { ...p, id, createdAt },
                  ...inMemoryPlaces.filter((item) => item.id !== id),
                ];
              }
              res.statusCode = 201;
              res.end(JSON.stringify({ success: true, id }));
              return;
            }

            // PUT
            if (req.method === 'PUT') {
              const p = await readJsonBody();
              if (sql) {
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
              } else {
                inMemoryPlaces = inMemoryPlaces.map((item) =>
                  item.id === p.id ? { ...item, ...p } : item
                );
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // DELETE
            if (req.method === 'DELETE') {
              const urlObj = new URL(req.url, 'http://localhost');
              const id = urlObj.searchParams.get('id');
              if (sql && id) {
                await sql`DELETE FROM places WHERE id = ${id};`;
              } else if (id) {
                inMemoryPlaces = inMemoryPlaces.filter((item) => item.id !== id);
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mapsResolverPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
