import { Coordinates, Route, ElevationPoint } from '../types';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { invoke } from '@tauri-apps/api/core';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getOrsApiKey(): string {
  return usePreferencesStore.getState().orsApiKey;
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export async function calculateRoute(
  coordinates: Coordinates[],
  profile: 'cycling-regular' | 'cycling-road' | 'cycling-mountain' | 'cycling-electric' | 'foot-hiking' = 'cycling-regular',
  signal?: AbortSignal
): Promise<{ route: Route; elevation: ElevationPoint[] } | null> {
  const apiKey = getOrsApiKey();
  if (!apiKey) {
    console.warn('Clé API ORS non configurée');
    return null;
  }

  if (coordinates.length < 2) return null;

  try {
    const data = await invoke<Record<string, unknown>>('calculate_ors_route', {
      request: {
        coordinates: coordinates.map(c => ({ lng: c.lng, lat: c.lat })),
        profile,
        api_key: apiKey,
      }
    });

    const features = data.features as Array<{
      geometry: GeoJSON.LineString;
      properties: { segments?: Array<{ distance: number; duration: number }> };
    }>;
    const feature = features[0];
    const geometry = feature.geometry;
    const segment = feature.properties.segments?.[0];

    const elevationProfile: ElevationPoint[] = [];
    let cumulativeDistance = 0;
    const MIN_ELEVATION_STEP = 5;

    if (geometry.coordinates.length > 0) {
      const rawElevations = geometry.coordinates.map(c => c[2] ?? 0);
      let lastCountedElev = rawElevations[0];
      let elevationGain = 0;

      for (let i = 0; i < geometry.coordinates.length; i++) {
        const curr: Coordinates = {
          lng: geometry.coordinates[i][0],
          lat: geometry.coordinates[i][1],
        };
        if (i > 0) {
          const prevCoord: Coordinates = {
            lng: geometry.coordinates[i - 1][0],
            lat: geometry.coordinates[i - 1][1],
          };
          cumulativeDistance += haversineDistance(prevCoord, curr);
        }

        const elev = rawElevations[i];
        const diff = elev - lastCountedElev;
        if (diff > MIN_ELEVATION_STEP) {
          elevationGain += diff;
          lastCountedElev = elev;
        } else if (diff < -MIN_ELEVATION_STEP) {
          lastCountedElev = elev;
        }

        elevationProfile.push({ distance: cumulativeDistance, elevation: elev });
      }

      const route: Route = {
        id: crypto.randomUUID(),
        name: '',
        points: coordinates.map((c, i) => ({
          id: crypto.randomUUID(),
          coordinates: c,
          order: i,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        distance: cumulativeDistance,
        duration: segment?.duration,
        geometry,
        elevationProfile,
        elevationGain: Math.round(elevationGain),
      };

      return { route, elevation: elevationProfile };
    }
  } catch (error) {
    console.error('Erreur calcul itinéraire:', error);
  }
  return null;
}

export function generateGPX(route: Route): string {
  let trackPoints = '';

  if (route.geometry?.coordinates && route.geometry.coordinates.length > 0) {
    trackPoints = route.geometry.coordinates.map(([lng, lat, elev]) => {
      const ele = elev != null ? `\n        <ele>${elev}</ele>` : '';
      return `      <trkpt lat="${lat}" lon="${lng}">${ele}\n      </trkpt>`;
    }).join('\n');
  } else if (route.points && route.points.length > 0) {
    trackPoints = [...route.points]
      .sort((a, b) => a.order - b.order)
      .map((p) => {
        return `      <trkpt lat="${p.coordinates.lat}" lon="${p.coordinates.lng}">\n      </trkpt>`;
      })
      .join('\n');
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Itervia" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(route.name)}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

export async function parseGPX(file: File): Promise<{ coords: Coordinates[]; elevations: number[] }> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');

  // Check for XML parse errors
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML file');
  }

  const coords: Coordinates[] = [];
  const elevations: number[] = [];
  const trkpts = xml.querySelectorAll('trkpt, wpt');

  if (trkpts.length === 0) {
    throw new Error('No track points found in GPX file');
  }

  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') || 'NaN');
    const lng = parseFloat(pt.getAttribute('lon') || 'NaN');
    if (!isNaN(lat) && !isNaN(lng)) {
      coords.push({ lng, lat });
      const eleEl = pt.querySelector('ele');
      elevations.push(eleEl ? parseFloat(eleEl.textContent || '0') : 0);
    }
  });

  return { coords, elevations };
}

export function snapToGeometry(
  point: Coordinates,
  geometry: GeoJSON.LineString,
  afterWpA: [number, number],
  beforeWpB: [number, number]
): Coordinates {
  const coords = geometry.coordinates;
  let bestDist = Infinity;
  let bestCoord: [number, number] = [point.lng, point.lat];

  for (const c of coords) {
    const lng = c[0];
    const lat = c[1];
    // Only consider points between the two waypoints (with margin)
    if (
      lng < Math.min(afterWpA[0], beforeWpB[0]) - 0.001 ||
      lng > Math.max(afterWpA[0], beforeWpB[0]) + 0.001 ||
      lat < Math.min(afterWpA[1], beforeWpB[1]) - 0.001 ||
      lat > Math.max(afterWpA[1], beforeWpB[1]) + 0.001
    ) continue;

    const dlng = point.lng - lng;
    const dlat = point.lat - lat;
    const dist = dlng * dlng + dlat * dlat;
    if (dist < bestDist) {
      bestDist = dist;
      bestCoord = [lng, lat];
    }
  }

  return { lng: bestCoord[0], lat: bestCoord[1] };
}

export function createElevationProfileFromGPX(
  coords: Coordinates[],
  elevations: number[]
): ElevationPoint[] {
  if (coords.length === 0) return [];

  const profile: ElevationPoint[] = [];
  let cumulativeDistance = 0;

  // Add first point
  profile.push({ distance: 0, elevation: elevations[0] || 0 });

  // Calculate cumulative distances for remaining points
  for (let i = 1; i < coords.length; i++) {
    cumulativeDistance += haversineDistance(coords[i - 1], coords[i]);
    profile.push({ distance: cumulativeDistance, elevation: elevations[i] || 0 });
  }

  return profile;
}