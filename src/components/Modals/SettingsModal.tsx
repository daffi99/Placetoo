import React, { useState } from 'react';
import { X, Key, RotateCcw, Download, Upload, Smartphone, Check, Sun } from 'lucide-react';
import { Place } from '../../types/place';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey: string;
  onSaveApiKey: (key: string) => void;
  jawgApiKey: string;
  onSaveJawgApiKey: (key: string) => void;
  onResetData: () => void;
  places: Place[];
  onImportData: (places: Place[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiApiKey,
  onSaveApiKey,
  jawgApiKey,
  onSaveJawgApiKey,
  onResetData,
  places,
  onImportData,
}) => {
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [isSavedKey, setIsSavedKey] = useState(false);

  const [jawgInput, setJawgInput] = useState(jawgApiKey);
  const [isSavedJawg, setIsSavedJawg] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    onSaveApiKey(keyInput.trim());
    setIsSavedKey(true);
    setTimeout(() => setIsSavedKey(false), 2000);
  };

  const handleSaveJawg = () => {
    onSaveJawgApiKey(jawgInput.trim());
    setIsSavedJawg(true);
    setTimeout(() => setIsSavedJawg(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(places, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `placetoo-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            onImportData(imported);
            alert(`Berhasil mengimpor ${imported.length} tempat!`);
            onClose();
          }
        } catch {
          alert('Format file JSON tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[750] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-2.5">
            <img
              src="/placetoo_icon.png"
              alt="Placetoo"
              className="w-8 h-8 rounded-xl object-cover shadow-2xs border border-slate-100"
            />
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">Pengaturan Placetoo</h2>
              <p className="text-[11px] text-slate-500">Konfigurasi API & Backup Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Jawg Maps Access Token Box */}
          <div className="border border-amber-200 rounded-2xl p-3.5 space-y-2 bg-amber-50/50">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <Sun size={16} className="text-amber-500" />
              <span>Jawg Maps Token (Untuk Tema Sunny Asli)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jika kamu punya Access Token gratis dari <a href="https://www.jawg.io" target="_blank" rel="noreferrer" className="text-amber-700 font-bold underline">jawg.io</a>, masukkan di sini. Jika kosong, aplikasi otomatis memakai tema Sunny preset gratis!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="jawg_token..."
                value={jawgInput}
                onChange={(e) => setJawgInput(e.target.value)}
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveJawg}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1"
              >
                {isSavedJawg ? <Check size={14} className="text-white" /> : 'Simpan'}
              </button>
            </div>
          </div>

          {/* Gemini API Key Box */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <Key size={16} className="text-emerald-600" />
              <span>Gemini API Key (Opsional)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dipakai jika kamu ingin membaca nama & detail kafe otomatis dari screenshot. Disimpan aman hanya di HP kamu.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1"
              >
                {isSavedKey ? <Check size={14} className="text-emerald-400" /> : 'Simpan'}
              </button>
            </div>
          </div>

          {/* iPhone PWA Tips */}
          <div className="border border-emerald-100 bg-emerald-50/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
              <Smartphone size={16} className="text-emerald-700" />
              <span>Cara Pasang di iPhone (PWA)</span>
            </div>
            <ol className="text-[11px] text-emerald-900/90 list-decimal list-inside space-y-1 leading-relaxed">
              <li>Buka link website ini di <strong>Safari iPhone</strong>.</li>
              <li>Klik tombol <strong>Share</strong> (ikon kotak tanda panah ke atas di bawah).</li>
              <li>Pilih menu <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</li>
              <li>App Placetoo siap dibuka fullscreen seperti aplikasi native!</li>
            </ol>
          </div>

          {/* Data Backup & Restore */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <h3 className="font-bold text-slate-800 text-xs">Backup & Berbagi Data</h3>
            <p className="text-[11px] text-slate-500">
              Kamu bisa ekspor list kafe ini ke file JSON untuk dikirim ke istri atau di-backup.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 py-2 px-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-all text-xs"
              >
                <Download size={14} /> Ekspor Data ({places.length})
              </button>

              <label className="flex-1 py-2 px-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer">
                <Upload size={14} /> Impor Data
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>

          {/* Reset to sample data */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (confirm('Kembalikan ke data awal (Madaya Coffee, Matcha Bae, dll)?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="w-full py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw size={14} /> Reset Data Contoh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
