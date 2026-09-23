import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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

            // Extract place name
            let name = '';
            const placeMatch = finalUrl.match(/\/maps\/place\/([^/@]+)/);
            if (placeMatch && placeMatch[1]) {
              try {
                name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
              } catch {
                name = placeMatch[1].replace(/\+/g, ' ');
              }
            }

            // Extract coordinates: either @lat,lng or !3dlat!4dlng
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
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                finalUrl,
                name: name || undefined,
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
