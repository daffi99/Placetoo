export type PlaceCategory = 'matcha' | 'coffee' | 'resto' | 'bakery' | 'dessert' | 'other';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  area: string; // e.g. "Senopati", "Blok M", "Bogor", "PIK"
  priceRange?: string; // e.g. "Rp 25-50 rb"
  rating?: number; // e.g. 4.9
  reviewCount?: number;
  photoUrl?: string;
  threadsUrl?: string;
  notes?: string; // e.g. "Istri mau coba burnt cheesecake & strawberry matchanya"
  googleMapsUrl?: string;
  isVisited: boolean;
  isFavorite: boolean;
  createdAt: number;
}

export type FilterCategory = 'all' | PlaceCategory | 'unvisited' | 'favorites';
