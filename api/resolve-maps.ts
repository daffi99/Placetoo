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
      // Check if rawQ is not just coordinate numbers
      if (!/^-?\d+\.\d+[,\s]+-?\d+\.\d+$/.test(rawQ.trim())) {
        const parts = rawQ.split(',').map((s) => s.trim());
        if (!name && parts.length > 0 && parts[0]) {
          name = parts[0];
        }
        address = rawQ;

        // Try extracting subdistrict / city for area
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

    return res.status(200).json({
      success: true,
      finalUrl,
      name: name || undefined,
      address: address || undefined,
      area: area || undefined,
      lat: lat !== null ? lat : undefined,
      lng: lng !== null ? lng : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
