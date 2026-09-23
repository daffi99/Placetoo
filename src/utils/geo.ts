/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export interface ParsedMapsData {
  name?: string;
  lat?: number;
  lng?: number;
  rawUrl?: string;
}

/**
 * Extracts place name and coordinates from common Google Maps URL formats
 */
export function parseGoogleMapsUrl(input: string): ParsedMapsData {
  const result: ParsedMapsData = { rawUrl: input.trim() };

  // Match: .../maps/place/Place+Name/@-6.491234,106.745678,17z/...
  const placeMatch = input.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch && placeMatch[1]) {
    try {
      result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    } catch {
      result.name = placeMatch[1].replace(/\+/g, ' ');
    }
  }

  // Match coordinates @-6.491234,106.745678
  const coordMatch = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    result.lat = parseFloat(coordMatch[1]);
    result.lng = parseFloat(coordMatch[2]);
    return result;
  }

  // Match query parameter ?q=-6.491234,106.745678 or ?ll=-6.491234,106.745678
  const qCoordMatch = input.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qCoordMatch) {
    result.lat = parseFloat(qCoordMatch[1]);
    result.lng = parseFloat(qCoordMatch[2]);
    return result;
  }

  // Match raw coordinates pasted directly: "-6.491234, 106.745678"
  const rawCoordMatch = input.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (rawCoordMatch) {
    result.lat = parseFloat(rawCoordMatch[1]);
    result.lng = parseFloat(rawCoordMatch[2]);
    return result;
  }

  return result;
}
