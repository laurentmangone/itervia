import { useEffect, useRef, useState } from 'react';
import { useMap } from '../hooks/useMap';
import { useRouteStore } from '../store/useRouteStore';
import { Coordinates } from '../types';

interface MapViewProps {
  onMapClick?: (coordinates: Coordinates, onRouteLine: boolean, segmentIndex?: number, wpA?: [number, number], wpB?: [number, number]) => void;
  onPointDrag?: (pointId: string, coordinates: Coordinates) => void;
  onPointDelete?: (pointId: string) => void;
}

export function MapView({ onMapClick, onPointDrag, onPointDelete }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onPointDragRef = useRef(onPointDrag);
  onPointDragRef.current = onPointDrag;
  const onPointDeleteRef = useRef(onPointDelete);
  onPointDeleteRef.current = onPointDelete;

  const { mapLoaded, addPointMarkers, clearMarkers, addRouteLine, clearRoute, flyToRoute, onMapClick: hookMapClick, setCursorStyle, moveTo, geocode } =
    useMap(containerRef);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lng: number; lat: number; label: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentRoute = useRouteStore((s) => s.currentRoute);
  const points = currentRoute?.points;
  const geometry = currentRoute?.geometry;

  useEffect(() => {
    if (!mapLoaded) return;
    const cleanup = hookMapClick((coords, onRouteLine, segIdx, wpA, wpB) => onMapClickRef.current?.(coords, onRouteLine, segIdx, wpA, wpB));
    return cleanup;
  }, [mapLoaded, hookMapClick]);

  useEffect(() => {
    if (!mapLoaded) return;
    setCursorStyle();
  }, [mapLoaded, setCursorStyle]);

  useEffect(() => {
    if (!mapLoaded || !currentRoute) return;
    if (points && points.length > 0) {
      addPointMarkers(points, {
        onDragEnd: (id, coords) => onPointDragRef.current?.(id, coords),
        onDelete: (id) => onPointDeleteRef.current?.(id),
      });
    } else {
      clearMarkers();
    }
    if (geometry) {
      addRouteLine(currentRoute);
      flyToRoute(currentRoute);
    }
  }, [mapLoaded, points, geometry, addPointMarkers, clearMarkers, addRouteLine, flyToRoute]);

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
    setSearchQuery('');
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
            {isSearching ? '...' : '\uD83D\uDD0D'}
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
