import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place } from '../../types/place';
import { Palette, Navigation2, Plus, Minus, Maximize2, Sun, Lightbulb, Layers, Sparkles, Flower2 } from 'lucide-react';
import { getCategorySvgString, getHeartSvgString } from '../../utils/categoryIcons';

export type MapSkin = 'light' | 'sunny' | 'gray' | 'minimal' | 'pastel';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  jawgApiKey?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  userLocation,
  onLocateMe,
  jawgApiKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayersRef = useRef<L.Layer[]>([]);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Map Skin State (Default: 'light' for Jawg Light)
  const [mapSkin, setMapSkin] = useState<MapSkin>(() => {
    return (localStorage.getItem('placetoo_map_skin') as MapSkin) || 'light';
  });

  const [showSkinMenu, setShowSkinMenu] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = [-6.25, 106.82];
    const defaultZoom = 12;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layers when skin changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove previous tile layers
    tileLayersRef.current.forEach((layer) => layer.remove());
    tileLayersRef.current = [];

    if (mapSkin === 'light') {
      if (jawgApiKey) {
        // Official Jawg Light with Access Token
        const jawg = L.tileLayer(
          `https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=${jawgApiKey}`,
          {
            attribution: '&copy; <a href="https://www.jawg.io" target="_blank">Jawg</a> &copy; OpenStreetMap',
            minZoom: 0,
            maxZoom: 22,
          }
        ).addTo(map);
        tileLayersRef.current = [jawg];
      } else {
        // High fidelity Light minimal preset over official OpenStreetMap
        const lightOsm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        tileLayersRef.current = [lightOsm];
      }
    } else if (mapSkin === 'sunny') {
      if (jawgApiKey) {
        // Official Jawg Sunny with Access Token
        const jawg = L.tileLayer(
          `https://tile.jawg.io/jawg-sunny/{z}/{x}/{y}{r}.png?access-token=${jawgApiKey}`,
          {
            attribution: '&copy; <a href="https://www.jawg.io" target="_blank">Jawg</a> &copy; OpenStreetMap',
            minZoom: 0,
            maxZoom: 22,
          }
        ).addTo(map);
        tileLayersRef.current = [jawg];
      } else {
        // High fidelity Sunny warm preset over official OpenStreetMap
        const sunny = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        tileLayersRef.current = [sunny];
      }
    } else if (mapSkin === 'gray') {
      // Esri Light Gray Canvas - The gold standard of ultra-minimalist maps
      const base = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, HERE, Garmin',
          maxZoom: 16,
        }
      ).addTo(map);

      const reference = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
        }
      ).addTo(map);

      tileLayersRef.current = [base, reference];
    } else if (mapSkin === 'pastel') {
      // Humanitarian OSM HOT - Soft pastel colors
      const hot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      tileLayersRef.current = [hot];
    } else {
      // 'minimal' - Standard OSM with soft Apple/Airbnb CSS filter
      const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      tileLayersRef.current = [osm];
    }

    localStorage.setItem('placetoo_map_skin', mapSkin);
  }, [mapSkin, jawgApiKey]);

  // Update Place Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const iconSvg = getCategorySvgString(place.category, isSelected);
      const heartSvg = place.isFavorite ? getHeartSvgString() : '';

      const pillHtml = `
        <div class="airbnb-pill ${isSelected ? 'active' : ''} ${place.isVisited ? 'visited' : ''}" id="pill-${place.id}">
          <span style="display:inline-flex; align-items:center;">${iconSvg}</span>
          <span>${place.name}</span>
          ${heartSvg ? `<span style="display:inline-flex; align-items:center; margin-left: 2px;">${heartSvg}</span>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: pillHtml,
        className: 'custom-airbnb-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectPlace(place);
        map.flyTo([place.lat, place.lng], 15, {
          duration: 0.8,
        });
      });

      markersRef.current.set(place.id, marker);
    });
  }, [places, selectedPlace, onSelectPlace]);

  // Automatically fly to & center map on selectedPlace
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo([selectedPlace.lat, selectedPlace.lng], 16, {
      duration: 0.8,
    });
  }, [selectedPlace]);

  // User GPS Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          html: '<div class="user-gps-pulse"></div>',
          className: 'custom-airbnb-marker',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    }
  }, [userLocation]);

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });
    } else {
      map.flyTo([-6.25, 106.82], 12);
    }
  };

  return (
    <div className={`relative w-full h-full skin-${mapSkin}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls (Right Side) */}
      <div className="absolute top-28 right-4 z-[500] flex flex-col gap-2">
        {/* Locate Me Button */}
        <button
          onClick={onLocateMe}
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-airbnb flex items-center justify-center text-slate-700 active:scale-90 transition-all border border-slate-100 hover:text-emerald-600"
          title="Lokasi Saya"
        >
          <Navigation2 size={18} />
        </button>

        {/* Zoom Out to Fit All Places */}
        <button
          onClick={handleFitAll}
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-airbnb flex items-center justify-center text-slate-700 active:scale-90 transition-all border border-slate-100 hover:text-emerald-600"
          title="Zoom Out Lihat Semua Tempat"
        >
          <Maximize2 size={16} />
        </button>

        {/* Zoom In & Zoom Out Segmented Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-airbnb border border-slate-100 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            className="w-11 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100"
            title="Zoom In"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-11 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            title="Zoom Out"
          >
            <Minus size={17} />
          </button>
        </div>

        {/* Skin Switcher Button */}
        <button
          onClick={() => setShowSkinMenu(!showSkinMenu)}
          className={`w-11 h-11 rounded-full shadow-airbnb flex items-center justify-center active:scale-90 transition-all border ${
            showSkinMenu
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-100 hover:text-emerald-600'
          }`}
          title="Ganti Tema Peta"
        >
          <Palette size={18} />
        </button>

        {/* Skin Selection Flyout Menu */}
        {showSkinMenu && (
          <div className="absolute right-14 top-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-airbnb p-2 border border-slate-100 w-44 space-y-1 animate-in fade-in slide-in-from-right-3 duration-200">
            <p className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
              Tema Peta
            </p>
            {[
              { id: 'light', label: 'Jawg Light', icon: <Lightbulb size={14} className="text-amber-500" />, desc: 'Bersih, terang & minimalis' },
              { id: 'sunny', label: 'Jawg Sunny', icon: <Sun size={14} className="text-amber-500" />, desc: 'Hangat, cerah & estetik' },
              { id: 'gray', label: 'Ultra Minimalis', icon: <Layers size={14} className="text-slate-400" />, desc: 'Monochrome bersih' },
              { id: 'minimal', label: 'Soft Airbnb', icon: <Sparkles size={14} className="text-emerald-500" />, desc: 'Muted warm tones' },
              { id: 'pastel', label: 'Pastel Warm', icon: <Flower2 size={14} className="text-rose-400" />, desc: 'Warna lembut' },
            ].map((skin) => (
              <button
                key={skin.id}
                onClick={() => {
                  setMapSkin(skin.id as MapSkin);
                  setShowSkinMenu(false);
                }}
                className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                  mapSkin === skin.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">{skin.icon}</span>
                    <span>{skin.label}</span>
                  </div>
                  <span className={`text-[10px] block ${mapSkin === skin.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {skin.desc}
                  </span>
                </div>
                {mapSkin === skin.id && <span className="text-emerald-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
