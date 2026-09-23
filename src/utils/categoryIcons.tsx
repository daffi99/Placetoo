import {
  Leaf,
  Coffee,
  Utensils,
  Croissant,
  IceCream2,
  MapPin,
  Sparkles,
  Heart,
  Bookmark,
} from 'lucide-react';
import { PlaceCategory, FilterCategory } from '../types/place';

// React Component Icon Map
export const getCategoryIcon = (category: PlaceCategory, size = 15, className = '') => {
  switch (category) {
    case 'matcha':
      return <Leaf size={size} className={className || 'text-emerald-600'} />;
    case 'coffee':
      return <Coffee size={size} className={className || 'text-amber-700'} />;
    case 'resto':
      return <Utensils size={size} className={className || 'text-orange-600'} />;
    case 'bakery':
      return <Croissant size={size} className={className || 'text-rose-600'} />;
    case 'dessert':
      return <IceCream2 size={size} className={className || 'text-pink-600'} />;
    default:
      return <MapPin size={size} className={className || 'text-slate-600'} />;
  }
};

export const getFilterIcon = (filter: FilterCategory, size = 15, className = '') => {
  switch (filter) {
    case 'all':
      return <Sparkles size={size} className={className || 'text-amber-500'} />;
    case 'favorites':
      return <Heart size={size} className={className || 'text-rose-500 fill-rose-500'} />;
    case 'unvisited':
      return <Bookmark size={size} className={className || 'text-indigo-500'} />;
    default:
      return getCategoryIcon(filter as PlaceCategory, size, className);
  }
};

// Raw SVG strings for Leaflet divIcon HTML
export const getCategorySvgString = (category: PlaceCategory, isSelected = false): string => {
  const strokeColor = isSelected ? '#ffffff' : '#334155';

  switch (category) {
    case 'matcha':
      // Leaf SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#a7f3d0' : '#059669'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
    case 'coffee':
      // Coffee Cup SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fed7aa' : '#b45309'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/><path d="M6 2v2"/><line x1="17" x2="20" y1="12" y2="12"/><path d="M20 12a2 2 0 0 0 0-4h-3"/></svg>`;
    case 'resto':
      // Utensils SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fed7aa' : '#ea580c'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 2v14"/><path d="M15 16v6"/><path d="M8 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2"/><path d="M6 8v14"/></svg>`;
    case 'bakery':
      // Croissant SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fbcfe8' : '#e11d48'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4.6 13.5 3.1-3.1"/><path d="m10.5 7.6 3.1-3.1"/><path d="m16.4 1.7 3.1-3.1"/><path d="M18 10a4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4Z"/><path d="m19 17-2.5-2.5"/><path d="m14.5 21.5-2.5-2.5"/></svg>`;
    case 'dessert':
      // Ice Cream SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fbcfe8' : '#db2777'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 11 4.3 8.6a2 2 0 0 0 3.4 0L19 11"/><path d="M12 18V8"/><circle cx="12" cy="7" r="4"/></svg>`;
    default:
      // MapPin SVG
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  }
};

export const getHeartSvgString = (): string => {
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
};
