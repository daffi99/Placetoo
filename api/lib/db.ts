import { neon, neonConfig } from '@neondatabase/serverless';

// Cache connection
let sql: any = null;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  if (!sql) {
    sql = neon(databaseUrl);
  }
  return sql;
}

export interface DbPlaceRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  area: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  photo_url: string | null;
  threads_url: string | null;
  notes: string | null;
  google_maps_url: string | null;
  is_visited: boolean;
  is_favorite: boolean;
  created_at: number;
}
