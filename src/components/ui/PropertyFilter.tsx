import { useState } from 'react';
import { Search } from 'lucide-react';
import { PropertyFilter as PropertyFilterType } from '@/types/property';
import { useAvailableCities } from '@/hooks/useSupabaseData';

interface PropertyFilterProps {
  onFilterChange: (filters: PropertyFilterType) => void;
  onSearch: (query: string) => void;
}

const PropertyFilter = ({ onFilterChange, onSearch }: PropertyFilterProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilterType>({});
  const { data: availableCities = [] } = useAvailableCities();

  const propertyTypes = [
    { value: '', label: 'Selecione' },
    { value: 'casa', label: 'Casa' },
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'rural', label: 'Rural' },
    { value: 'cobertura', label: 'Cobertura' },
    { value: 'flat', label: 'Flat' },
    { value: 'galpao', label: 'Galpão' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onFilterChange(filters);
  };

  const handleFilterChange = (newFilters: Partial<PropertyFilterType>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };

  const handleMinPriceChange = (value: string) => {
    const numValue = value ? Number(value.replace(/\D/g, '')) : undefined;
    handleFilterChange({ minPrice: numValue });
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value ? Number(value.replace(/\D/g, '')) : undefined;
    handleFilterChange({ maxPrice: numValue });
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(numbers));
    return formatted;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Encontre o seu imóvel ideal
        </h2>
        <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Referência
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearchSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Tipo do Imóvel */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Tipo do Imóvel
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Mínimo */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Valor mínimo
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={filters.minPrice ? formatCurrency(filters.minPrice.toString()) : ''}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Valor Máximo */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Valor máximo
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={filters.maxPrice ? formatCurrency(filters.maxPrice.toString()) : ''}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              Cidade
            </label>
            <select
              value={filters.city || ''}
              onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">Todas as cidades</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Pesquisar */}
          <div>
            <button
              type="submit"
              className="w-full bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Search size={18} />
              <span>Pesquisar</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyFilter;