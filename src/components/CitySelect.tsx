import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Check, Search } from 'lucide-react';
import { CITIES_BY_PROVINCE } from '../data/wilayah';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

/**
 * Dropdown kota/kabupaten yang bisa diketik untuk memfilter (searchable),
 * dengan hasil dikelompokkan per provinsi. Tetap wajib memilih dari daftar.
 */
export default function CitySelect({ value, onChange, placeholder }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter kota per provinsi sesuai query. Provinsi tanpa hasil disembunyikan.
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES_BY_PROVINCE;
    return CITIES_BY_PROVINCE
      .map((g) => ({
        ...g,
        cities: g.cities.filter((c) => c.toLowerCase().includes(q)),
      }))
      .filter((g) => g.cities.length > 0);
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Tombol pemicu */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-left focus:outline-none focus:border-primary focus:bg-white transition-all flex items-center"
      >
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <span className={value ? 'text-accent' : 'text-neutral-400'}>
          {value || placeholder || 'Pilih kota / kabupaten...'}
        </span>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      </button>

      {/* Panel dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
          {/* Kotak pencarian */}
          <div className="p-2 border-b border-neutral-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama kota/kabupaten..."
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Daftar terkelompok per provinsi */}
          <div className="max-h-60 overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-400">
                Tidak ada kota yang cocok.
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.code}>
                  <div className="px-3 py-1.5 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-400 sticky top-0">
                    {group.name}
                  </div>
                  {group.cities.map((city) => (
                    <button
                      key={`${group.code}-${city}`}
                      type="button"
                      onClick={() => {
                        onChange(city);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-primary-light transition-colors ${
                        value === city ? 'text-primary font-semibold bg-primary-light' : 'text-accent'
                      }`}
                    >
                      {city}
                      {value === city && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
