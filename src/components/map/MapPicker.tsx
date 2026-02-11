"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Search } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialPosition?: [number, number];
  setDireccion?: (direccion: string) => void;
  direccionInicial?: string;
}

export default function MapPicker({ 
  onLocationSelect, 
  initialPosition = [-12.0464, -77.0428],
  setDireccion,
  direccionInicial
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(direccionInicial || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [zoom, setZoom] = useState(17);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapId] = useState(() => `map-${Date.now()}`);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (query === lastSearchedQuery) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pe&limit=5&addressdetails=1`
      );
      
      setSearchResults(response.data || []);
      setShowResults(true);
      setLastSearchedQuery(query);
    } catch (error) {
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [lastSearchedQuery]);

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.data) {
        let address = response.data.display_name || '';
        
        if (response.data.address) {
          const addr = response.data.address;
          const street = addr.road || addr.footway || addr.path || '';
          const number = addr.house_number || '';
          const suburb = addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || 'Lima';
          
          if (street && street !== address) {
            address = `${street}${number ? ' ' + number : ''}${suburb ? ', ' + suburb : ''}, ${city}, Perú`;
          }
        }
        
        setSelectedAddress(address);
        setSearchQuery(address);
        
        if (setDireccion) {
          setDireccion(address);
        }
        
        onLocationSelect(lat, lng, address);
        return address;
      }
    } catch (error) {
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      setSearchQuery(fallbackAddress);
      onLocationSelect(lat, lng, fallbackAddress);
      return fallbackAddress;
    }
  }, [onLocationSelect, setDireccion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mapRef.current || mapInstance.current) return;

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }

        mapInstance.current = L.map(mapRef.current).setView(position, 17);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);
        
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        markerRef.current = L.marker(position, {
          icon: customIcon,
          draggable: true
        })
          .addTo(mapInstance.current)
          .bindPopup('Arrastra para mover')
          .openPopup();

        mapInstance.current.on('click', async (e: any) => {
          const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
          setPosition(newPos);
          setZoom(17);
          
          if (markerRef.current) {
            markerRef.current.setLatLng(newPos);
            markerRef.current.openPopup();
          }
          
          await getAddressFromCoordinates(newPos[0], newPos[1]);
          
          setSearchResults([]);
          setShowResults(false);
        });

        markerRef.current.on('dragend', async (e: any) => {
          const marker = e.target;
          const newPos = marker.getLatLng();
          const positionArray: [number, number] = [newPos.lat, newPos.lng];
          
          setPosition(positionArray);
          setZoom(17);
          
          await getAddressFromCoordinates(newPos.lat, newPos.lng);
          
          setSearchResults([]);
          setShowResults(false);
        });

        mapInstance.current.on('zoomend', () => {
          if (mapInstance.current) {
            setZoom(mapInstance.current.getZoom());
          }
        });

        setIsLoaded(true);

        if (direccionInicial) {
          await getAddressFromCoordinates(position[0], position[1]);
        }

      } catch (error) {}
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapId, direccionInicial]);

  useEffect(() => {
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView(position, zoom);
      markerRef.current.setLatLng(position);
    }
  }, [position, zoom]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery === lastSearchedQuery) return;
    
    await searchAddress(searchQuery);
  }, [searchQuery, lastSearchedQuery, searchAddress]);

  const handleSelectResult = useCallback(async (result: any) => {
    const newPos: [number, number] = [
      parseFloat(result.lat),
      parseFloat(result.lon)
    ];
    
    setPosition(newPos);
    setZoom(17);
    setSearchQuery(result.display_name);
    setSelectedAddress(result.display_name);
    setShowResults(false);
    
    if (mapInstance.current) {
      mapInstance.current.setView(newPos, 17);
    }
    
    if (markerRef.current) {
      markerRef.current.setLatLng(newPos);
      markerRef.current.openPopup();
    }
    
    if (setDireccion) {
      setDireccion(result.display_name);
    }
    
    onLocationSelect(newPos[0], newPos[1], result.display_name);
  }, [onLocationSelect, setDireccion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  }, [handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (showResults) {
      setShowResults(false);
    }
  }, [showResults]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Buscar dirección, empresa o lugar..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              'Buscar'
            )}
          </button>
        </form>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={`${result.place_id}-${index}`}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectResult(result)}
              >
                <div className="font-medium text-sm">{result.display_name}</div>
                {result.type && (
                  <div className="text-xs text-gray-500 mt-1">
                    Tipo: {result.type} • Importancia: {result.importance.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative">
        <div className="relative h-64 sm:h-80 md:h-96">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Cargando mapa...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef}
            id={mapId}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}