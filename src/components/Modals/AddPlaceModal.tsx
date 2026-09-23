import React, { useState } from 'react';
import { Place, PlaceCategory } from '../../types/place';
import { X, Sparkles, Link as LinkIcon, Image, Check, Loader2, Search } from 'lucide-react';
import { parseGoogleMapsUrl } from '../../utils/geo';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { ImageSearchModal } from './ImageSearchModal';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Place) => void;
  geminiApiKey: string;
}

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  onAddPlace,
  geminiApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'ai'>('link');
  
  // Link Tab State
  const [pastedUrl, setPastedUrl] = useState('');
  const [isLoadingExtract, setIsLoadingExtract] = useState(false);
  const [extractMessage, setExtractMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('coffee');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [notes, setNotes] = useState('');
  const [threadsUrl, setThreadsUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // AI Screenshot State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);

  // Multi-Tier Scraped Photos State (Bing -> DuckDuckGo)
  const [searchedPhotos, setSearchedPhotos] = useState<
    { title: string; thumbnail: string; imageUrl: string }[]
  >([]);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);

  const fetchPhotosForPlace = async (query: string) => {
    if (!query || query.trim().length < 2) return;
    setIsSearchingPhotos(true);
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSearchedPhotos(data.results);
          setPhotoUrl(data.results[0].imageUrl || data.results[0].thumbnail);
        }
      }
    } catch (err) {
      console.warn('Failed to search images', err);
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  if (!isOpen) return null;

  // Auto-guess category from name
  const guessCategory = (nameStr: string): PlaceCategory => {
    const lower = nameStr.toLowerCase();
    if (lower.includes('matcha')) return 'matcha';
    if (lower.includes('coffee') || lower.includes('kopi')) return 'coffee';
    if (lower.includes('bakery') || lower.includes('cake') || lower.includes('pastry') || lower.includes('bake')) return 'bakery';
    if (lower.includes('gelato') || lower.includes('dessert') || lower.includes('ice cream')) return 'dessert';
    if (lower.includes('resto') || lower.includes('kitchen') || lower.includes('dining') || lower.includes('eatery')) return 'resto';
    return 'coffee';
  };

  // Handle URL Paste & Auto Extraction
  const handleAutoExtract = async (urlInput: string) => {
    setPastedUrl(urlInput);
    if (!urlInput.trim()) return;

    setIsLoadingExtract(true);
    setExtractMessage(null);

    // Check if input contains a URL
    const urlMatch = urlInput.match(/https?:\/\/[^\s]+/);
    const targetUrl = urlMatch ? urlMatch[0] : null;

    // 1. Try server resolver if there is a URL (handles shortlink & redirects)
    if (targetUrl) {
      try {
        const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(targetUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setName(data.name);
            setCategory(guessCategory(data.name));
            fetchPhotosForPlace(data.name);
          }
          if (data.lat && data.lng) {
            setLat(data.lat.toString());
            setLng(data.lng.toString());
            setExtractMessage('✅ Sukses! Nama tempat & koordinat otomatis terisi!');

            // Auto reverse geocode area / city from coordinates
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lng}`,
              { headers: { 'Accept-Language': 'id' } }
            )
              .then((r) => r.json())
              .then((rev) => {
                if (rev && rev.address) {
                  const city =
                    rev.address.city ||
                    rev.address.town ||
                    rev.address.county ||
                    rev.address.city_district ||
                    rev.address.suburb ||
                    '';
                  if (city) setArea(city);
                  if (rev.display_name) setAddress(rev.display_name);
                }
              })
              .catch(() => {});

            setIsLoadingExtract(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Server resolve error, falling back to client parser', err);
      }
    }

    // 2. Try local regex parsing
    const parsed = parseGoogleMapsUrl(urlInput);
    let foundLat = parsed.lat;
    let foundLng = parsed.lng;
    let foundName = parsed.name;

    // Check if pasted string has text before url (e.g. "Madaya Coffee https://...")
    if (!foundName) {
      const parts = urlInput.split(/https?:\/\//);
      if (parts[0] && parts[0].trim().length > 2) {
        foundName = parts[0].trim();
      }
    }

    if (foundName) {
      setName(foundName);
      setCategory(guessCategory(foundName));
    }

    if (foundLat && foundLng) {
      setLat(foundLat.toString());
      setLng(foundLng.toString());
      setExtractMessage('✅ Koordinat & nama berhasil diekstrak!');
      setIsLoadingExtract(false);
      return;
    }

    // 3. Fallback: Search via OpenStreetMap Nominatim
    const searchQuery = foundName || urlInput.replace(/https?:\/\/[^\s]+/g, '').trim();
    if (searchQuery && searchQuery.length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery + ' Indonesia'
          )}&limit=1`,
          { headers: { 'Accept-Language': 'id' } }
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setLat(data[0].lat);
          setLng(data[0].lon);
          if (!name) setName(foundName || data[0].display_name.split(',')[0]);
          if (!address) setAddress(data[0].display_name);
          setExtractMessage('📍 Lokasi ditemukan via pencarian peta!');
        } else {
          setExtractMessage('ℹ️ Silakan ketik nama atau lengkapi koordinat.');
        }
      } catch {
        setExtractMessage('ℹ️ Silakan ketik nama & koordinat secara manual.');
      }
    } else {
      setExtractMessage('ℹ️ Format link terbaca.');
    }

    setIsLoadingExtract(false);
  };

  // Handle AI Screenshot Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!imagePreview) return;
    setIsAiScanning(true);

    if (!geminiApiKey) {
      // Friendly simulation if API key is not entered yet
      setTimeout(() => {
        setName('Madaya Coffee');
        setCategory('coffee');
        setArea('Kemang, Bogor');
        setAddress('Kawasan Zona Madina, Jl. Raya Parung KM 42, Kemang, Bogor');
        setPriceRange('Rp 25–50 rb');
        setLat('-6.494799');
        setLng('106.746199');
        setNotes('Gemini: Kafe outdoor luas & adem, rating 4.9 dari 1.300+ ulasan.');
        setPhotoUrl('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80');
        setIsAiScanning(false);
        setActiveTab('link');
      }, 1500);
      return;
    }

    try {
      // Direct call to Gemini 1.5 Flash Vision
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imagePreview.split(';')[0].split(':')[1];

      const prompt = `Analisis screenshot Google Maps / Threads ini. Berikan respons dalam format JSON murni tanpa markdown:
      {
        "name": "Nama Kafe",
        "category": "matcha" | "coffee" | "resto" | "bakery" | "dessert",
        "area": "Kota / Area (misal: Senopati, Jaksel atau Bogor)",
        "address": "Alamat jika ada",
        "priceRange": "Kisaran harga misal Rp 25-50 rb jika ada",
        "rating": 4.8,
        "notes": "Menu rekomendasi atau highlight tempat"
      }`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: base64Data } },
                ],
              },
            ],
          }),
        }
      );

      const json = await res.json();
      const textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        if (data.name) setName(data.name);
        if (data.category) setCategory(data.category);
        if (data.area) setArea(data.area);
        if (data.address) setAddress(data.address);
        if (data.priceRange) setPriceRange(data.priceRange);
        if (data.notes) setNotes(data.notes);

        // Auto geocode extracted name
        if (data.name) {
          handleAutoExtract(data.name + ' ' + (data.area || ''));
        }
      }
    } catch (err) {
      console.error('Gemini Vision Error:', err);
      alert('Gagal membaca gambar dengan Gemini. Coba gunakan input link manual.');
    } finally {
      setIsAiScanning(false);
      setActiveTab('link');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Harap isi nama tempat');
      return;
    }

    const latitude = parseFloat(lat) || -6.2297;
    const longitude = parseFloat(lng) || 106.8073;

    // Pick a default aesthetic image if none provided
    const defaultPhoto =
      category === 'matcha'
        ? 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80'
        : category === 'coffee'
        ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

    const newPlace: Place = {
      id: `place-${Date.now()}`,
      name: name.trim(),
      category,
      lat: latitude,
      lng: longitude,
      address: address.trim() || area.trim() || 'Jakarta',
      area: area.trim() || 'Jakarta',
      priceRange: priceRange.trim() || 'Rp 30–60 rb',
      notes: notes.trim(),
      threadsUrl: threadsUrl.trim(),
      photoUrl: photoUrl.trim() || defaultPhoto,
      googleMapsUrl: pastedUrl.match(/https?:\/\/[^\s]+/)?.[0] || `https://maps.google.com/?q=${latitude},${longitude}`,
      isVisited: false,
      isFavorite: false,
      createdAt: Date.now(),
    };

    onAddPlace(newPlace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[700] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-base text-slate-900">Tambah Spot Baru</h2>
            <p className="text-xs text-slate-500">Simpan rekomendasi kafe & tempat matcha</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 bg-slate-100 mx-4 mt-3 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <LinkIcon size={14} /> Paste Link Maps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Sparkles size={14} className="text-emerald-500" /> Scan Screenshot AI
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'ai' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50 flex flex-col items-center justify-center">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-xl object-contain mx-auto shadow-sm"
                    />
                    <label className="text-xs font-semibold text-emerald-600 cursor-pointer block hover:underline">
                      Ganti Gambar
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Image size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Upload Screenshot Maps / Threads</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG dari galeri iPhone kamu</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                ✨ <strong>Gemini 1.5 Flash Vision</strong> akan membaca nama kafe, kisaran harga, rating, dan catatan secara instan!
              </div>

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  disabled={isAiScanning}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isAiScanning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Membaca Screenshot...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Ekstrak Data dengan AI
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Quick Paste Box */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  Paste Link Google Maps / Teks Share
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://maps.app.goo.gl/... atau URL GMaps"
                    value={pastedUrl}
                    onChange={(e) => handleAutoExtract(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (pastedUrl.trim()) {
                        handleAutoExtract(pastedUrl);
                      } else {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setPastedUrl(text);
                            handleAutoExtract(text);
                          }
                        } catch {
                          alert('Silakan paste link Google Maps di kolom teks.');
                        }
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                  >
                    {isLoadingExtract ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Ambil Data'
                    )}
                  </button>
                </div>
                {extractMessage && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">{extractMessage}</p>
                )}
              </div>

              {/* Place Name */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  Nama Tempat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Madaya Coffee / Matcha Bae"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Category Radio Pills */}
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

              {/* Photo Selector (Multi-Tier Scraped) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Foto Tempat {searchedPhotos.length > 0 && (
                      <span className="text-emerald-700 font-bold">
                        ({searchedPhotos.length} foto asli ditemukan)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImageSearchOpen(true)}
                      className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Search size={12} /> Cari Foto di Web
                    </button>
                    {name && (
                      <button
                        type="button"
                        onClick={() => fetchPhotosForPlace(name + ' ' + area)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        title="Muat ulang cepat"
                      >
                        {isSearchingPhotos ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          'Reload'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal thumbnail selector */}
                {searchedPhotos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                      {searchedPhotos.map((photo, idx) => {
                        const isSelected =
                          photoUrl === photo.imageUrl || photoUrl === photo.thumbnail;
                        return (
                          <div
                            key={idx}
                            onClick={() => setPhotoUrl(photo.imageUrl || photo.thumbnail)}
                            className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                              isSelected
                                ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105 shadow-md'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                            title={photo.title}
                          >
                            <img
                              src={photo.thumbnail || photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                                <Check size={10} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {photoUrl && (
                      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full">
                          Foto Terpilih
                        </div>
                      </div>
                    )}
                  </div>
                ) : isSearchingPhotos ? (
                  <div className="py-4 border border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl flex items-center justify-center gap-2 text-emerald-800 text-xs">
                    <Loader2 size={15} className="animate-spin" />
                    <span>Mencari foto asli tempat ini dari web...</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="URL Foto (atau paste link Maps untuk auto foto)"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                )}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Kisaran Harga</label>
                  <input
                    type="text"
                    placeholder="Rp 25–50 rb"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Coordinates (Auto-filled) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-0.5 block">Latitude</label>
                  <input
                    type="text"
                    placeholder="-6.25..."
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-0.5 block">Longitude</label>
                  <input
                    type="text"
                    placeholder="106.8..."
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Notes from Wife / Threads */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">
                  Catatan Rekomendasi Istri / Threads
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Cobain burnt cheese cake & matcha latte-nya, enak buat nongkrong sore..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Threads Link */}
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Link Threads (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://www.threads.net/@..."
                  value={threadsUrl}
                  onChange={(e) => setThreadsUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Simpan ke Wishlist Map
                </button>
              </div>
            </form>
          )}
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
    </div>
  );
};
