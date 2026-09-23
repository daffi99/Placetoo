import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, Image as ImageIcon, Sparkles, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  currentImageUrl?: string;
  onSelectImage: (imageUrl: string) => void;
}

interface ScrapedImage {
  title: string;
  thumbnail: string;
  imageUrl: string;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  currentImageUrl,
  onSelectImage,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<ScrapedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedUrl(currentImageUrl || '');
      setErrorMsg(null);
      if (initialQuery.trim().length >= 2) {
        handleSearch(initialQuery);
      }
    }
  }, [isOpen, initialQuery, currentImageUrl]);

  const handleSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setPhotos(data.results);
          // If no image is currently selected, default pick the first high-res one
          if (!selectedUrl && data.results[0]) {
            setSelectedUrl(data.results[0].imageUrl || data.results[0].thumbnail);
          }
        } else {
          setPhotos([]);
          setErrorMsg('Tidak ada foto yang ditemukan untuk kata kunci ini.');
        }
      } else {
        setErrorMsg('Gagal mengambil foto. Silakan coba kata kunci lain.');
      }
    } catch (err) {
      console.warn('Image search error', err);
      setErrorMsg('Koneksi bermasalah saat mencari foto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickKeywords = [
    { label: 'Semua', modifier: '' },
    { label: 'Suasana / Tempat', modifier: ' interior' },
    { label: 'Menu Makanan', modifier: ' menu' },
    { label: 'Kopi & Minuman', modifier: ' coffee' },
    { label: 'Matcha', modifier: ' matcha' },
    { label: 'Pastry / Dessert', modifier: ' pastry' },
  ];

  const handleApplyKeyword = (modifier: string) => {
    const base = initialQuery.trim();
    const newQ = base + modifier;
    setQuery(newQ);
    handleSearch(newQ);
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelectImage(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Cari Foto Kafe</h3>
              <p className="text-xs text-slate-500">Pilih foto asli dari web (Bing / DuckDuckGo)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
          >
            <X size={17} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 pb-2 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama kafe / menu / area..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Cari</span>
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            {quickKeywords.map((kw, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyKeyword(kw.modifier)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-600 shrink-0 font-medium active:scale-95 transition-all shadow-2xs"
              >
                {kw.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Mencari foto berkualitas dari web...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="text-xs">{errorMsg}</p>
              <button
                type="button"
                onClick={() => handleSearch(query)}
                className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw size={13} /> Coba lagi
              </button>
            </div>
          ) : photos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ImageIcon size={32} className="mx-auto text-slate-300" />
              <p className="text-xs">Ketik nama tempat dan tekan Cari untuk menemukan foto.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  Ditemukan {photos.length} foto:
                </span>
                <span className="text-[11px] text-slate-400">Pilih salah satu untuk dipakai</span>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((photo, idx) => {
                  const isSelected = selectedUrl === photo.imageUrl || selectedUrl === photo.thumbnail;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedUrl(photo.imageUrl || photo.thumbnail)}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all aspect-[4/3] bg-slate-100 ${
                        isSelected
                          ? 'border-emerald-600 ring-4 ring-emerald-500/20 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                      title={photo.title}
                    >
                      <img
                        src={photo.thumbnail || photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // If thumbnail fails, try full image or fallback
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Selection Overlay */}
                      {isSelected ? (
                        <div className="absolute inset-0 bg-emerald-600/20 flex items-start justify-end p-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      )}

                      {/* Title banner */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-1.5 pt-3">
                        <p className="text-[10px] text-white/90 truncate font-medium">{photo.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual URL Input Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 py-1"
            >
              <LinkIcon size={13} />
              <span>{showManualInput ? 'Sembunyikan Input URL' : 'Atau tempel link gambar URL langsung'}</span>
            </button>

            {showManualInput && (
              <div className="flex gap-2 mt-2 animate-in fade-in duration-150">
                <input
                  type="url"
                  placeholder="https://... (URL foto jpg/png/webp)"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualUrl.trim()) {
                      setSelectedUrl(manualUrl.trim());
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0"
                >
                  Pilih
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedUrl ? (
              <>
                <img
                  src={selectedUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <span className="text-[11px] text-slate-600 font-medium truncate">
                  Foto terpilih siap digunakan
                </span>
              </>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Belum ada foto yang dipilih</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Check size={14} /> Gunakan Foto Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
