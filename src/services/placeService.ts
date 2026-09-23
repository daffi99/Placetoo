import { Place } from '../types/place';
import { INITIAL_PLACES } from '../data/mockPlaces';

const STORAGE_KEY = 'placetoo_places';

export const placeService = {
  // Read local cache
  getLocalPlaces(): Place[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read places from localStorage', e);
    }
    return INITIAL_PLACES;
  },

  // Save local cache
  saveLocalPlaces(places: Place[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch (e) {
      console.warn('Failed to write places to localStorage', e);
    }
  },

  // Fetch places from Neon DB via /api/places, falling back to local storage
  async fetchPlaces(): Promise<{ places: Place[]; fromDb: boolean }> {
    try {
      const res = await fetch('/api/places');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.fromDb && Array.isArray(data.places) && data.places.length > 0) {
        // Map database row types if needed
        const mappedPlaces: Place[] = data.places.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          lat: Number(p.lat),
          lng: Number(p.lng),
          address: p.address || '',
          area: p.area || '',
          priceRange: p.priceRange || '',
          rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : 4.5,
          reviewCount: p.reviewCount !== null && p.reviewCount !== undefined ? Number(p.reviewCount) : 0,
          photoUrl: p.photoUrl || '',
          threadsUrl: p.threadsUrl || '',
          notes: p.notes || '',
          googleMapsUrl: p.googleMapsUrl || '',
          isVisited: Boolean(p.isVisited),
          isFavorite: Boolean(p.isFavorite),
          createdAt: Number(p.createdAt) || Date.now(),
        }));

        this.saveLocalPlaces(mappedPlaces);
        return { places: mappedPlaces, fromDb: true };
      }
    } catch (err) {
      console.info('API fetch failed or not yet deployed with DB, using local storage:', err);
    }

    // Fallback to local storage
    return { places: this.getLocalPlaces(), fromDb: false };
  },

  // Save/Create a place
  async createPlace(place: Place): Promise<void> {
    try {
      await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
    } catch (err) {
      console.warn('Background sync failed to save place to DB:', err);
    }
  },

  // Update a place
  async updatePlace(place: Place): Promise<void> {
    try {
      await fetch('/api/places', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
    } catch (err) {
      console.warn('Background sync failed to update place in DB:', err);
    }
  },

  // Delete a place
  async deletePlace(id: string): Promise<void> {
    try {
      await fetch(`/api/places?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Background sync failed to delete place from DB:', err);
    }
  },
};
