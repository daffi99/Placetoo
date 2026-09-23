import { FilterCategory } from '../../types/place';
import { Search, Plus, Settings } from 'lucide-react';
import { getFilterIcon } from '../../utils/categoryIcons';

interface TopNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterCategory;
  onSelectFilter: (f: FilterCategory) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
  onOpenAddModal,
  onOpenSettings,
}) => {
  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'matcha', label: 'Matcha' },
    { id: 'coffee', label: 'Kopi' },
    { id: 'resto', label: 'Resto' },
    { id: 'bakery', label: 'Bakery' },
    { id: 'favorites', label: 'Favorit' },
    { id: 'unvisited', label: 'Belum ke Sana' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 z-[400] px-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.85rem))] pb-2 pointer-events-none">
      <div className="max-w-md mx-auto space-y-2.5">
        {/* Search Bar + Add Button Row */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-full shadow-airbnb border border-slate-200/80 pl-2.5 pr-3 py-2 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-emerald-500/30">
            <img
              src="/placetoo_icon.png"
              alt="Placetoo"
              className="w-7 h-7 rounded-full object-cover shrink-0 shadow-2xs border border-slate-100"
            />
            <Search size={15} className="text-slate-400 shrink-0 ml-0.5" />
            <input
              type="text"
              placeholder="Cari kafe, matcha, area..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onOpenAddModal}
            className="h-11 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-airbnb flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all shrink-0"
            title="Tambah Tempat"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden xs:inline">Tambah</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 bg-white/95 backdrop-blur-md hover:bg-slate-100 text-slate-700 rounded-full shadow-airbnb flex items-center justify-center border border-slate-200/80 active:scale-95 transition-all shrink-0"
            title="Pengaturan"
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Category Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border shadow-sm ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                    : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center">
                  {getFilterIcon(cat.id, 13, isActive ? 'text-white' : undefined)}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
