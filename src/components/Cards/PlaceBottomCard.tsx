import React from 'react';
import { Place } from '../../types/place';
import { X, Heart, Navigation, ExternalLink, CheckCircle2, MessageCircle, Trash2, MapPin, Star, Pencil } from 'lucide-react';
import { calculateDistance, formatDistance } from '../../utils/geo';

interface PlaceBottomCardProps {
  place: Place;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleVisited: (id: string) => void;
  onDeletePlace: (id: string) => void;
  onEditPlace?: (place: Place) => void;
  onCenter?: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export const PlaceBottomCard: React.FC<PlaceBottomCardProps> = ({
  place,
  onClose,
  onToggleFavorite,
  onToggleVisited,
  onDeletePlace,
  onEditPlace,
  onCenter,
  userLocation,
}) => {
  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
    : null;

  const handleOpenMaps = () => {
    if (place.googleMapsUrl) {
      window.open(place.googleMapsUrl, '_blank');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      place.name + ' ' + (place.area || '')
    )}`;
    window.open(url, '_blank');
  };

  const handleOpenNavigation = () => {
    // Open in native Google Maps or Apple Maps app for directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${encodeURIComponent(
      place.name
    )}`;
    window.open(url, '_blank');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'matcha':
        return { label: 'Matcha Spot', bg: 'bg-emerald-100 text-emerald-800' };
      case 'coffee':
        return { label: 'Coffee Shop', bg: 'bg-amber-100 text-amber-900' };
      case 'resto':
        return { label: 'Restaurant', bg: 'bg-orange-100 text-orange-900' };
      case 'bakery':
        return { label: 'Bakery / Pastry', bg: 'bg-rose-100 text-rose-900' };
      default:
        return { label: 'Place', bg: 'bg-slate-100 text-slate-800' };
    }
  };

  const badge = getCategoryBadge(place.category);

  return (
    <div className="absolute bottom-5 left-4 right-4 z-[500] max-w-md mx-auto animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-3xl shadow-airbnb overflow-hidden border border-slate-100/90 relative">
        {/* Floating Top Controls */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-center pointer-events-none">
          <button
            onClick={onClose}
            className="pointer-events-auto w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => onEditPlace?.(place)}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white active:scale-90 transition-all"
              title="Edit Info & Ganti Foto"
              aria-label="Edit"
            >
              <Pencil size={14} />
            </button>

            <button
              onClick={() => {
                if (confirm(`Hapus "${place.name}" dari daftar?`)) {
                  onDeletePlace(place.id);
                  onClose();
                }
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white active:scale-90 transition-all"
              title="Hapus Tempat"
              aria-label="Hapus"
            >
              <Trash2 size={15} />
            </button>

            <button
              onClick={() => onToggleFavorite(place.id)}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all"
              aria-label="Favorit"
            >
              <Heart
                size={17}
                className={place.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}
              />
            </button>
          </div>
        </div>

        {/* Card Content Layout */}
        <div className="flex flex-col">
          {/* Photo Header */}
          {place.photoUrl && (
            <div
              onClick={onCenter}
              className="relative h-40 w-full overflow-hidden bg-slate-100 cursor-pointer group"
              title="Pusatkan di peta"
            >
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                loading="lazy"
              />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm ${badge.bg}`}>
                  {badge.label}
                </span>
                {place.isVisited && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} /> Sudah Pernah
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="p-4 space-y-2.5">
            <div className="flex justify-between items-start">
              <div onClick={onCenter} className="cursor-pointer group flex-1">
                <h3 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                  {place.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{place.area || place.address}</span>
                  {distance !== null && (
                    <span className="text-emerald-600 font-semibold">• {formatDistance(distance)}</span>
                  )}
                </p>
              </div>

              {place.rating && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-slate-800">{place.rating}</span>
                  {place.reviewCount && (
                    <span className="text-[10px] text-slate-400">({place.reviewCount})</span>
                  )}
                </div>
              )}
            </div>

            {/* Price & Highlight */}
            {place.priceRange && (
              <div className="text-xs font-medium text-slate-600">
                Estimasi: <span className="font-semibold text-slate-900">{place.priceRange}</span>
              </div>
            )}

            {/* Threads / Wife Notes */}
            {place.notes && (
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-950 flex items-start gap-2">
                <MessageCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="italic leading-relaxed">{place.notes}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-1 flex items-center gap-1.5">
              <button
                onClick={handleOpenMaps}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-sm"
                title="Buka info tempat di Google Maps"
              >
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate">Buka di Maps</span>
              </button>

              <button
                onClick={handleOpenNavigation}
                className="py-2.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shrink-0"
                title="Petunjuk Arah Rute"
              >
                <Navigation size={13} className="text-blue-500 shrink-0" />
                <span>Rute</span>
              </button>

              <button
                onClick={() => onToggleVisited(place.id)}
                className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 shrink-0 ${
                  place.isVisited
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 size={13} className={place.isVisited ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{place.isVisited ? 'Sudah' : 'Belum'}</span>
              </button>

              {place.threadsUrl && (
                <a
                  href={place.threadsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shrink-0"
                  title="Lihat Threads"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
