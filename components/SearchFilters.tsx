// components/SearchFilters.tsx
import { useState } from 'react';

interface SearchFiltersProps {
  onFilter: (filters: {
    location?: string;
    school?: string;
    maxPrice?: number;
    minBeds?: number;
  }) => void;
}

export default function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    location: '',
    school: '',
    maxPrice: '',
    minBeds: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      location: filters.location || undefined,
      school: filters.school || undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      minBeds: filters.minBeds ? parseInt(filters.minBeds) : undefined
    });
  };

  const handleReset = () => {
    setFilters({
      location: '',
      school: '',
      maxPrice: '',
      minBeds: ''
    });
    onFilter({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Località
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={filters.location}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Es. Roma"
          />
        </div>
        
        <div>
          <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
            Scuola
          </label>
          <input
            type="text"
            id="school"
            name="school"
            value={filters.school}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Es. Liceo Scientifico"
          />
        </div>
        
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Prezzo massimo (€)
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label htmlFor="minBeds" className="block text-sm font-medium text-gray-700 mb-1">
            Posti letto (min)
          </label>
          <select
            id="minBeds"
            name="minBeds"
            value={filters.minBeds}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Qualsiasi</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded"
        >
          Azzera filtri
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Applica filtri
        </button>
      </div>
    </form>
  );
}
