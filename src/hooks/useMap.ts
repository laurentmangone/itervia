import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Coordinates, RoutePoint, Route } from '../types';

const DEFAULT_CENTER: Coordinates = { lng: 2.3522, lat: 48.8566 };
const DEFAULT_ZOOM = 12;

function createMarkerElement(order: number, _total: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'route-point-marker';
  el.innerHTML = `
    <span class="route-point-number">${order + 1}</span>
    <button class="route-point-delete" title="Supprimer ce point">&times;</button>
  `;
  return el;
}

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  const moveTo = useCallback((lng: number, lat: number, label?: string) => {
    if (!mapRef.current) return;
    mapRef.current.jumpTo({ center: [lng, lat], zoom: 14 });

    if (mapRef.current.getSource('user-location')) {
      (mapRef.current.getSource('user-location') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { label: label || '' },
      });
    } else {
      mapRef.current.addSource('user-location', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { label: label || '' } },
      });
      mapRef.current.addLayer({
        id: 'user-location',
        type: 'circle',
        source: 'user-location',
        paint: { 'circle-radius': 10, 'circle-color': '#3b82f6', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
      });
    }
  }, []);

  const geocode = useCallback(async (query: string): Promise<{ lng: number; lat: number; label: string }[]> => {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      return data.map((r: any) => ({
        lng: parseFloat(r.lon),
        lat: parseFloat(r.lat),
        label: r.display_name as string,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      if (!cancelled) setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [containerRef]);

  const addPointLayer = useCallback((_points: RoutePoint[]) => {
    // Markers are managed via addPointMarkers
  }, []);

  const addPointMarkers = useCallback((
    points: RoutePoint[],
    options?: {
      onDragEnd?: (pointId: string, coordinates: Coordinates) => void;
      onDelete?: (pointId: string) => void;
    }
  ) => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const markers = markersRef.current;

    // Remove all old markers and recreate to ensure correct order numbers
    markers.forEach((m) => m.remove());
    markers.clear();

    for (const point of points) {
      const el = createMarkerElement(point.order, points.length);

      const deleteBtn = el.querySelector('.route-point-delete') as HTMLButtonElement;
      if (deleteBtn && options?.onDelete) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          options.onDelete!(point.id);
        });
      }

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([point.coordinates.lng, point.coordinates.lat])
        .addTo(map);

      if (options?.onDragEnd) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          options.onDragEnd!(point.id, { lng: lngLat.lng, lat: lngLat.lat });
        });
      }

      markers.set(point.id, marker);
    }
  }, [mapLoaded]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
  }, []);

  const addRouteLine = useCallback((route: Route) => {
    if (!mapRef.current || !mapLoaded || !route.geometry) return;

    const map = mapRef.current;

    if (map.getSource('route-line')) {
      (map.getSource('route-line') as maplibregl.GeoJSONSource).setData(route.geometry);
    } else {
      map.addSource('route-line', {
        type: 'geojson',
        data: route.geometry,
      });

      map.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }
  }, [mapLoaded]);

  const clearRoute = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    ['route-line-layer'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['route-line'].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
    clearMarkers();
  }, [clearMarkers]);

  const flyToRoute = useCallback((route: Route) => {
    if (!mapRef.current || !route.geometry) return;
    const bounds = new maplibregl.LngLatBounds();
    route.geometry.coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
  }, []);

  const onMapClick = useCallback((callback: (coordinates: Coordinates, onRouteLine: boolean, segmentIndex?: number, wpA?: [number, number], wpB?: [number, number]) => void) => {
    if (!mapRef.current) return () => {};
    const handler = (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, { layers: ['route-line-layer'] });
      if (features && features.length > 0) {
        // Find which waypoint segment was clicked
        const markers = markersRef.current;
        if (markers.size >= 2) {
          const waypoints: [number, number][] = [];
          // Sort markers by their order number
          const entries = Array.from(markers.entries());
          entries.sort((a, b) => {
            const numA = parseInt(a[1].getElement().querySelector('.route-point-number')?.textContent || '0');
            const numB = parseInt(b[1].getElement().querySelector('.route-point-number')?.textContent || '0');
            return numA - numB;
          });
          for (const [, m] of entries) {
            const ll = m.getLngLat();
            waypoints.push([ll.lng, ll.lat]);
          }

          // Find closest segment between consecutive waypoints
          let minDist = Infinity;
          let bestIdx = 0;
          const clickPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];

          for (let i = 0; i < waypoints.length - 1; i++) {
            const [ax, ay] = waypoints[i];
            const [bx, by] = waypoints[i + 1];
            // Project click point onto segment
            const dx = bx - ax;
            const dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            let t = lenSq === 0 ? 0 : ((clickPt[0] - ax) * dx + (clickPt[1] - ay) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const px = ax + t * dx;
            const py = ay + t * dy;
            const dist = (clickPt[0] - px) ** 2 + (clickPt[1] - py) ** 2;
            if (dist < minDist) {
              minDist = dist;
              bestIdx = i;
            }
          }

          callback({ lng: e.lngLat.lng, lat: e.lngLat.lat }, true, bestIdx, waypoints[bestIdx], waypoints[bestIdx + 1]);
          return;
        }
      }
      callback({ lng: e.lngLat.lng, lat: e.lngLat.lat }, false);
    };
    mapRef.current.on('click', handler);
    return () => mapRef.current?.off('click', handler);
  }, []);

  const setCursorStyle = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    map.on('mouseenter', 'route-line-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'route-line-layer', () => {
      map.getCanvas().style.cursor = '';
    });
  }, [mapLoaded]);

  return {
    map: mapRef.current,
    mapLoaded,
    addPointLayer,
    addPointMarkers,
    clearMarkers,
    addRouteLine,
    clearRoute,
    flyToRoute,
    onMapClick,
    setCursorStyle,
    moveTo,
    geocode,
  };
}
