import React, { useState, useEffect } from 'react';
import { Place, PlaceCategory } from '../../types/place';
import { X, Check, Search, Image as ImageIcon, Sparkles, Star, Crosshair } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { ImageSearchModal } from './ImageSearchModal';

interface EditPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  onSavePlace: (updated: Place) => void;
  onAdjustLocation?: (place: Place) => void;
}

export const EditPlaceModal: React.FC<EditPlaceModalProps> = ({
  isOpen,
  onClose,
  place,
  onSavePlace,
  onAdjustLocation,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('coffee');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [rating, setRating] = useState<string>('');
  const [reviewCount, setReviewCount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [threadsUrl, setThreadsUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isVisited, setIsVisited] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Sub-modal for image searching
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  useEffect(() => {
    if (place && isOpen) {
      setName(place.name || '');
      setCategory(place.category || 'coffee');
      setArea(place.area || '');
      setAddress(place.address || '');
      setPriceRange(place.priceRange || '');
      setRating(place.rating ? place.rating.toString() : '');
      setReviewCount(place.reviewCount ? place.reviewCount.toString() : '');
      setNotes(place.notes || '');
      setThreadsUrl(place.threadsUrl || '');
      setPhotoUrl(place.photoUrl || '');
      setGoogleMapsUrl(place.googleMapsUrl || '');
      setLat(place.lat.toString());
      setLng(place.lng.toString());
      setIsVisited(place.isVisited || false);
      setIsFavorite(place.isFavorite || false);
    }
  }, [place, isOpen]);

  if (!isOpen || !place) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama tempat wajib diisi');
      return;
    }

    const updated: Place = {
      ...place,
      name: name.trim(),
      category,
      area: area.trim() || 'Jakarta',
      address: address.trim() || area.trim() || 'Jakarta',
      priceRange: priceRange.trim() || undefined,
      rating: rating ? parseFloat(rating) : undefined,
      reviewCount: reviewCount ? parseInt(reviewCount, 10) : undefined,
      notes: notes.trim() || undefined,
      threadsUrl: threadsUrl.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      lat: parseFloat(lat) || place.lat,
      lng: parseFloat(lng) || place.lng,
      isVisited,
      isFavorite,
    };

    onSavePlace(updated);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[700] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="font-bold text-base text-slate-900">Edit Tempat</h2>
              <p className="text-xs text-slate-500">Perbarui info, foto, atau catatan menu</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Photo Card with prominent "Cari Gambar" action */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">Foto Utama</label>
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[16/9] group">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || 'Preview'}
                    className="w-full h-full object-cover transition-all"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-slate-50">
                    <ImageIcon size={32} />
                    <span className="text-xs">Belum ada foto</span>
                  </div>
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 opacity-95 group-hover:opacity-100 transition-opacity p-4">
                  <button
                    type="button"
                    onClick={() => setIsImageSearchOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Search size={14} />
                    <span>Cari Gambar di Web</span>
                  </button>
                  <p className="text-[10px] text-white/90 drop-shadow">
                    Pencarian otomatis foto kafe lokal tanpa API berbayar
                  </p>
                </div>
              </div>

              {/* Direct photo URL input */}
              <div className="mt-2 flex gap-1.5">
                <input
                  type="url"
                  placeholder="Atau masukkan URL foto langsung..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-xl font-medium shrink-0"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">
                Nama Tempat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white font-semibold text-slate-900"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">Kategori</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'matcha', label: 'Matcha' },
                  { id: 'coffee', label: 'Kopi' },
                  { id: 'resto', label: 'Resto' },
                  { id: 'bakery', label: 'Pastry' },
                  { id: 'dessert', label: 'Dessert' },
                  { id: 'other', label: 'Lainnya' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as PlaceCategory)}
                    className={`py-2 px-2 text-center rounded-xl font-bold border transition-all text-[11px] flex items-center justify-center gap-1.5 ${
                      category === cat.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center">
                      {getCategoryIcon(cat.id as PlaceCategory, 13, category === cat.id ? 'text-white' : undefined)}
                    </span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Area & Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Area / Kota</label>
                <input
                  type="text"
                  placeholder="Senopati / Bogor"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Kisaran Harga</label>
                <input
                  type="text"
                  placeholder="Rp 25–50 rb"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span>Rating (1 - 5)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  placeholder="4.8"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Jumlah Ulasan</label>
                <input
                  type="number"
                  placeholder="1250"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Alamat Lengkap</label>
              <input
                type="text"
                placeholder="Jl. ..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Catatan Istri / Menu Threads */}
            <div>
              <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Sparkles size={12} className="text-emerald-600" />
                <span>Catatan Menu Rekomendasi Istri / Threads</span>
              </label>
              <textarea
                rows={3}
                placeholder="Catatan menu favorit, dessert enak, spot foto..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white resize-none"
              />
            </div>

            {/* Google Maps Link */}
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Link Google Maps</label>
              <input
                type="url"
                placeholder="https://maps.app.goo.gl/... atau URL GMaps"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white font-mono"
              />
            </div>

            {/* Threads Link */}
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Link Threads / Sosmed</label>
              <input
                type="url"
                placeholder="https://www.threads.net/@..."
                value={threadsUrl}
                onChange={(e) => setThreadsUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Coordinates */}
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-0.5 block">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-0.5 block">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {place && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAdjustLocation?.(place);
                  }}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-200 active:scale-95 transition-all cursor-pointer"
                >
                  <Crosshair size={14} className="text-emerald-600" />
                  <span>Geser / Atur Titik Pin di Peta</span>
                </button>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={15} /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Image Search Modal */}
      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        initialQuery={name || ''}
        currentImageUrl={photoUrl}
        onSelectImage={(newUrl) => {
          setPhotoUrl(newUrl);
        }}
      />
    </>
  );
};
