"use client";

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';

interface Option {
  uuid: string;
  nombre: string;
}

interface OptionInfinitoProps {
  data: Option[];
  value: string;
  onChange: (value: string) => void;
  onSearch?: (searchTerm: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  dropdownId?: string; // 🔥 Identificador único para cada dropdown
  loading?: boolean; // Para loading inicial
}

// Componente memoizado
export const OptionInfinito = memo(function OptionInfinito({ 
  data, 
  value, 
  onChange, 
  onSearch,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  placeholder = "Seleccione una opción...",
  required = false,
  dropdownId = "default",
  loading = false
}: OptionInfinitoProps) {
  // 🔥 Estado local para cada dropdown
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoizar handlers
  const handleSelect = useCallback((item: Option) => {
    onChange(item.uuid);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si hay onSearch, lo ejecutamos (puedes agregar debounce aquí si necesitas)
    if (onSearch && value.length >= 2) {
      onSearch(value);
    }
  }, [onSearch]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
      e.preventDefault();
    }
  }, [onSearch, searchTerm]);

  const toggleDropdown = useCallback(() => {
    if (loading) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Focus en el input de búsqueda cuando se abre
    if (newIsOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loading]);

  // Observador para scroll infinito
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    const currentList = listRef.current;
    if (currentList && currentList.lastElementChild) {
      observer.observe(currentList.lastElementChild);
    }

    return () => {
      if (currentList && currentList.lastElementChild) {
        observer.unobserve(currentList.lastElementChild);
      }
    };
  }, [onLoadMore, hasMore, isLoading, data]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar búsqueda cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedItem = data.find(item => item.uuid === value);
  const filteredData = searchTerm 
    ? data.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input que simula el select */}
      <div
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={toggleDropdown}
      >
        <span className={`flex-1 truncate ${!selectedItem ? 'text-muted-foreground' : ''}`}>
          {loading ? 'Cargando...' : (selectedItem ? selectedItem.nombre : placeholder)}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${
          isOpen ? 'rotate-180' : ''
        } ${loading ? 'opacity-50' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          {/* Barra de búsqueda */}
          <div className="sticky top-0 bg-background p-2 border-b border-input">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="overflow-y-auto flex-1" ref={listRef}>
            {filteredData.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {isLoading ? 'Buscando...' : 'No se encontraron resultados'}
              </div>
            ) : (
              <>
                {filteredData.map((item) => (
                  <div
                    key={`${dropdownId}-${item.uuid}`}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${
                      value === item.uuid ? 'bg-accent font-medium' : ''
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    {item.nombre}
                  </div>
                ))}
                
                {/* Loader para scroll infinito */}
                {isLoading && (
                  <div className="flex justify-center items-center py-3 border-t">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    <span className="text-xs text-muted-foreground">Cargando más...</span>
                  </div>
                )}
                
                {/* Indicador de más datos */}
                {hasMore && !isLoading && filteredData.length > 0 && (
                  <div className="px-3 py-2 text-xs text-center text-muted-foreground border-t">
                    Desplázate para cargar más...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});