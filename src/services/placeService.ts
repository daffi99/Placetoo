import { Place } from '../types/place';

export const placeService = {
  // Fetch places directly from Database API (/api/places) - No LocalStorage!
  async fetchPlaces(): Promise<Place[]> {
    try {
      const res = await fetch('/api/places');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.places)) {
        return data.places.map((p: any) => ({
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
      }
    } catch (err) {
      console.error('Failed to fetch places from DB API:', err);
    }
    return [];
  },

  // Save / Create a place in Database
  async createPlace(place: Place): Promise<boolean> {
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to save place to DB:', err);
      return false;
    }
  },

  // Update a place in Database
  async updatePlace(place: Place): Promise<boolean> {
    try {
      const res = await fetch('/api/places', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update place in DB:', err);
      return false;
    }
  },

  // Delete a place from Database
  async deletePlace(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/places?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to delete place from DB:', err);
      return false;
    }
  },

  // One-time automatic migration: if browser has existing localStorage data,
  // upload them to the server database and clean up localStorage.
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const raw = localStorage.getItem('placetoo_places');
      if (!raw) return;
      const localPlaces = JSON.parse(raw);
      if (Array.isArray(localPlaces) && localPlaces.length > 0) {
        console.log(`Migrating ${localPlaces.length} places from LocalStorage to Neon DB...`);
        for (const place of localPlaces) {
          await this.createPlace(place);
        }
        localStorage.removeItem('placetoo_places');
        console.log('LocalStorage migration to Neon DB completed!');
      }
    } catch (err) {
      console.warn('Error during one-time local storage migration:', err);
    }
  },
};
