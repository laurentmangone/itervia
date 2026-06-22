import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Coordinates, RoutePoint, Route } from '../types';

const DEFAULT_CENTER: Coordinates = { lng: 2.3522, lat: 48.8566 };
const DEFAULT_ZOOM = 12;

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);
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
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [containerRef]);

  const addPointLayer = useCallback((points: RoutePoint[]) => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (map.getSource('route-points')) {
      (map.getSource('route-points') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: points.map((p) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
          properties: { id: p.id, order: p.order },
        })),
      });
    } else {
      map.addSource('route-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.coordinates.lng, p.coordinates.lat] },
            properties: { id: p.id, order: p.order },
          })),
        },
      });

      map.addLayer({
        id: 'route-points-circle',
        type: 'circle',
        source: 'route-points',
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'route-points-label',
        type: 'symbol',
        source: 'route-points',
        layout: {
          'text-field': ['get', 'order'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#3b82f6',
          'text-halo-width': 1,
        },
      });
    }
  }, [mapLoaded]);

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
    ['route-line-layer', 'route-points-circle', 'route-points-label'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ['route-line', 'route-points'].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
  }, []);

  const flyToRoute = useCallback((route: Route) => {
    if (!mapRef.current || !route.geometry) return;
    const bounds = new maplibregl.LngLatBounds();
    route.geometry.coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
  }, []);

  const onMapClick = useCallback((callback: (coordinates: Coordinates) => void) => {
    if (!mapRef.current) return () => {};
    const handler = (e: maplibregl.MapMouseEvent) => {
      callback({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    mapRef.current.on('click', handler);
    return () => mapRef.current?.off('click', handler);
  }, []);

  return {
    map: mapRef.current,
    mapLoaded,
    addPointLayer,
    addRouteLine,
    clearRoute,
    flyToRoute,
    onMapClick,
    moveTo,
    geocode,
  };
}