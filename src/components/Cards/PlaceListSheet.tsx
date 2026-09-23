import React from 'react';
import { Place } from '../../types/place';
import { X, Trash2, Heart, Pencil } from 'lucide-react';
import { calculateDistance, formatDistance } from '../../utils/geo';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface PlaceListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  onSelectPlace: (place: Place) => void;
  onDeletePlace: (id: string) => void;
  onEditPlace?: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
}

export const PlaceListSheet: React.FC<PlaceListSheetProps> = ({
  isOpen,
  onClose,
  places,
  onSelectPlace,
  onDeletePlace,
  onEditPlace,
  userLocation,
}) => {
  if (!isOpen) return null;

  // Sort by distance if user location is available
  const sortedPlaces = [...places].sort((a, b) => {
    if (!userLocation) return b.createdAt - a.createdAt;
    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
    return distA - distB;
  });

  return (
    <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl max-h-[85vh] h-[80vh] flex flex-col shadow-2xl overflow-hidden max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <img
              src="/placetoo_icon.png"
              alt="Placetoo"
              className="w-8 h-8 rounded-full object-cover shadow-2xs border border-slate-100 shrink-0"
            />
            <div>
              <h2 className="font-bold text-base text-slate-900">Daftar Tempat ({places.length})</h2>
              <p className="text-xs text-slate-500">
                {userLocation ? 'Diurutkan dari yang paling dekat' : 'Semua tempat yang disimpan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 pb-10">
          {sortedPlaces.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Belum ada tempat yang cocok dengan filter ini.
            </div>
          ) : (
            sortedPlaces.map((place) => {
              const distance = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng)
                : null;

              return (
                <div
                  key={place.id}
                  onClick={() => {
                    onSelectPlace(place);
                    onClose();
                  }}
                  className="flex gap-3 p-2.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                    {place.photoUrl ? (
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        {getCategoryIcon(place.category, 24)}
                      </div>
                    )}
                    {place.isFavorite && (
                      <span className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm p-1 rounded-full text-rose-500 shadow-sm flex items-center justify-center">
                        <Heart size={11} className="fill-rose-500 text-rose-500" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{place.name}</h4>
                        {place.rating && (
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                            ★ {place.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{place.area || place.address}</p>
                      {place.notes && (
                        <p className="text-[11px] text-emerald-800 line-clamp-1 italic mt-1 bg-emerald-50/60 px-1.5 py-0.5 rounded">
                          "{place.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-2">
                      <span className="font-semibold text-slate-800">{place.priceRange || 'Kafe'}</span>
                      <div className="flex items-center gap-1.5">
                        {distance !== null && (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                            {formatDistance(distance)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlace?.(place);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:scale-90 transition-all"
                          title="Edit Tempat"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Hapus "${place.name}" dari daftar?`)) {
                              onDeletePlace(place.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
