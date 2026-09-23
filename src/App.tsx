import React, { useState, useEffect, useMemo } from 'react';
import { Place, FilterCategory } from './types/place';
import { INITIAL_PLACES } from './data/mockPlaces';
import { placeService } from './services/placeService';
import { MapView } from './components/Map/MapView';
import { TopNavbar } from './components/Navigation/TopNavbar';
import { PlaceBottomCard } from './components/Cards/PlaceBottomCard';
import { PlaceListSheet } from './components/Cards/PlaceListSheet';
import { AddPlaceModal } from './components/Modals/AddPlaceModal';
import { EditPlaceModal } from './components/Modals/EditPlaceModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { List } from 'lucide-react';

export const App: React.FC = () => {
  // Places state loaded directly from Neon PostgreSQL Database (PWA-ready, no localStorage reliance)
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize places from Server Database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialPlaces() {
      setIsLoading(true);
      // Auto-migrate any residual localStorage data if any existed previously
      await placeService.migrateFromLocalStorage();
      const serverPlaces = await placeService.fetchPlaces();
      if (isMounted) {
        setPlaces(serverPlaces);
        setIsLoading(false);
      }
    }
    loadInitialPlaces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected place for bottom card preview
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Sheets
  const [isListOpen, setIsListOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('placetoo_gemini_key') || '';
  });

  // Jawg Maps API Key state
  const [jawgApiKey, setJawgApiKey] = useState<string>(() => {
    return localStorage.getItem('placetoo_jawg_key') || '';
  });

  // User GPS Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Save Gemini Key to LocalStorage
  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('placetoo_gemini_key', key);
  };

  // Save Jawg Key to LocalStorage
  const handleSaveJawgApiKey = (key: string) => {
    setJawgApiKey(key);
    localStorage.setItem('placetoo_jawg_key', key);
  };

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      // Search matching
      const matchesSearch =
        searchQuery === '' ||
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.notes && place.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Category matching
      if (activeFilter === 'all') return true;
      if (activeFilter === 'favorites') return place.isFavorite;
      if (activeFilter === 'unvisited') return !place.isVisited;
      return place.category === activeFilter;
    });
  }, [places, activeFilter, searchQuery]);

  // Request GPS User Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung akses lokasi GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert('Gagal mengambil lokasi saat ini. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, isFavorite: !p.isFavorite };
          if (selectedPlace?.id === id) setSelectedPlace(updated);
          placeService.updatePlace(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Toggle visited
  const handleToggleVisited = (id: string) => {
    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, isVisited: !p.isVisited };
          if (selectedPlace?.id === id) setSelectedPlace(updated);
          placeService.updatePlace(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Select place and center map smoothly
  const handleSelectPlace = (place: Place | null) => {
    if (!place) {
      setSelectedPlace(null);
      return;
    }
    setSelectedPlace({ ...place });
  };

  // Add place
  const handleAddPlace = (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev]);
    setSelectedPlace({ ...newPlace });
    placeService.createPlace(newPlace);
  };

  // Edit place
  const handleOpenEdit = (place: Place) => {
    setEditingPlace(place);
    setIsEditOpen(true);
  };

  const handleSaveEditedPlace = (updated: Place) => {
    setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPlace?.id === updated.id) {
      setSelectedPlace(updated);
    }
    placeService.updatePlace(updated);
    setIsEditOpen(false);
    setEditingPlace(null);
  };

  // Delete place
  const handleDeletePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlace?.id === id) {
      setSelectedPlace(null);
    }
    placeService.deletePlace(id);
  };

  // Reset to initial
  const handleResetData = async () => {
    setPlaces(INITIAL_PLACES);
    setSelectedPlace(null);
    for (const p of INITIAL_PLACES) {
      await placeService.createPlace(p);
    }
  };

  const handleImportData = async (importedPlaces: Place[]) => {
    setPlaces(importedPlaces);
    for (const p of importedPlaces) {
      await placeService.createPlace(p);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 flex flex-col font-sans select-none">
      {/* Loading from Neon Database indicator */}
      {isLoading && places.length === 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[450] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2 animate-pulse">
          <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Memuat kafe dari database...</span>
        </div>
      )}
      {/* Top Navbar: Search + Filters */}
      <TopNavbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Map View */}
      <div className="flex-1 w-full h-full relative">
        <MapView
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          userLocation={userLocation}
          onLocateMe={handleLocateMe}
          jawgApiKey={jawgApiKey}
        />
      </div>

      {/* Floating Bottom List Toggle Button (Airbnb Style) */}
      {!selectedPlace && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[450] animate-in fade-in duration-200">
          <button
            onClick={() => setIsListOpen(true)}
            className="bg-slate-900/95 hover:bg-slate-800 text-white backdrop-blur-md px-5 py-3 rounded-full shadow-airbnb flex items-center gap-2 text-xs font-bold active:scale-95 transition-all border border-slate-700/50"
          >
            <List size={16} />
            <span>Daftar ({filteredPlaces.length})</span>
          </button>
        </div>
      )}

      {/* Airbnb-style Floating Bottom Card when a pin is selected */}
      {selectedPlace && (
        <PlaceBottomCard
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onToggleFavorite={handleToggleFavorite}
          onToggleVisited={handleToggleVisited}
          onDeletePlace={handleDeletePlace}
          onEditPlace={handleOpenEdit}
          onCenter={() => handleSelectPlace(selectedPlace)}
          userLocation={userLocation}
        />
      )}

      {/* Expandable List Drawer */}
      <PlaceListSheet
        isOpen={isListOpen}
        onClose={() => setIsListOpen(false)}
        places={filteredPlaces}
        onSelectPlace={handleSelectPlace}
        onDeletePlace={handleDeletePlace}
        onEditPlace={handleOpenEdit}
        userLocation={userLocation}
      />

      {/* Add Place Modal (Paste link or AI scan) */}
      <AddPlaceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddPlace={handleAddPlace}
        geminiApiKey={geminiApiKey}
      />

      {/* Edit Place Modal */}
      <EditPlaceModal
        isOpen={isEditOpen}
        place={editingPlace}
        onClose={() => {
          setIsEditOpen(false);
          setEditingPlace(null);
        }}
        onSavePlace={handleSaveEditedPlace}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiApiKey={geminiApiKey}
        onSaveApiKey={handleSaveApiKey}
        jawgApiKey={jawgApiKey}
        onSaveJawgApiKey={handleSaveJawgApiKey}
        onResetData={handleResetData}
        places={places}
        onImportData={handleImportData}
      />
    </div>
  );
};

export default App;
