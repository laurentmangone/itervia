import { useEffect, useRef, useState } from 'react';
import { useMap } from '../hooks/useMap';
import { useRouteStore } from '../store/useRouteStore';

interface MapViewProps {
  onMapClick?: (coordinates: { lng: number; lat: number }) => void;
}

export function MapView({ onMapClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const { mapLoaded, addPointLayer, addRouteLine, clearRoute, flyToRoute, onMapClick: hookMapClick, moveTo, geocode } =
    useMap(containerRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lng: number; lat: number; label: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentRoute = useRouteStore((s) => s.currentRoute);
  const points = currentRoute?.points;
  const geometry = currentRoute?.geometry;

  useEffect(() => {
    if (!mapLoaded) return;
    const cleanup = hookMapClick((coords) => onMapClickRef.current?.(coords));
    return cleanup;
  }, [mapLoaded, hookMapClick]);

  useEffect(() => {
    if (!mapLoaded || !currentRoute) return;
    if (points && points.length > 0) {
      addPointLayer(points);
    }
    if (geometry) {
      addRouteLine(currentRoute);
      flyToRoute(currentRoute);
    }
  }, [mapLoaded, points, geometry, addPointLayer, addRouteLine, flyToRoute]);

  useEffect(() => {
    if (!mapLoaded) return;
    if (!currentRoute) {
      clearRoute();
    }
  }, [mapLoaded, !!currentRoute, clearRoute]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await geocode(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectResult = (result: { lng: number; lat: number; label: string }) => {
    moveTo(result.lng, result.lat, result.label);
    setSearchResults([]);
    setSearchQuery(result.label.split(',')[0]);
  };

  return (
    <div className="map-wrapper">
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        className="map-container"
      />
      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un lieu..."
            className="search-input"
          />
          <button type="submit" className="search-btn" disabled={isSearching}>
            {isSearching ? '...' : '🔍'}
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((r, i) => (
              <li key={i} onClick={() => handleSelectResult(r)}>
                {r.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}