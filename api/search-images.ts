import type { VercelRequest, VercelResponse } from '@vercel/node';

const LISTICLE_REGEX =
  /\b\d+\s*(cafe|coffee|rekomendasi|tempat|kedai|spot|pilihan|wisata|kuliner)\b|\brekomendasi\s+\d+|\bdaftar\s+\d+|\bterbaik di\b|\bhits di\b|\bviral di\b|\bpaling hits\b/i;

function cleanSearchQuery(query: string): string {
  return query.replace(/\s+(cafe|indonesia)\s*$/gi, '').trim();
}

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

async function searchBingImages(query: string, limit = 18) {
  const cleanQ = cleanSearchQuery(query);
  const quoted = cleanQ.includes('"') ? cleanQ : `"${cleanQ}"`;

  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(quoted)}&FORM=HDRSC2`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    },
  });
  const html = await res.text();
  const matches = [...html.matchAll(/class="iusc"[^>]*m="([^"]+)"/g)];

  const results: any[] = [];
  for (let i = 0; i < matches.length; i++) {
    try {
      const rawJson = matches[i][1].replace(/&quot;/g, '"');
      const parsed = JSON.parse(rawJson);
      if (!parsed.murl) continue;

      results.push({
        title: parsed.t ? parsed.t.replace(/&amp;/g, '&') : cleanQ,
        thumbnail: (parsed.turl || parsed.murl).replace(/&amp;/g, '&'),
        imageUrl: parsed.murl,
      });

      if (results.length >= limit) break;
    } catch {}
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = (req.query.q as string) || (req.body && req.body.q);
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const limitParam = parseInt((req.query.limit as string) || '16', 10);

    // 1. Primary: DuckDuckGo Social & Culinary Filter
    let images = await searchDdgSocialImages(query, limitParam);

    // 2. Fallback: DuckDuckGo General Images
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

    // 3. Fallback: Bing Images
    if (!images || images.length === 0) {
      images = await searchBingImages(query, limitParam);
    }

    return res.status(200).json({ success: true, results: images });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, results: [] });
  }
}
