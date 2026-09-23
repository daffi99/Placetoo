import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetUrl = (req.query.url as string) || (req.body && req.body.url);
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    let currentUrl = targetUrl;
    let finalUrl = targetUrl;

    // Follow redirects manually
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

    return res.status(200).json({
      success: true,
      finalUrl,
      name: name || undefined,
      lat: lat !== null ? lat : undefined,
      lng: lng !== null ? lng : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
