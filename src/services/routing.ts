import { Coordinates, Route, ElevationPoint } from '../types';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || '';

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
  if (!ORS_API_KEY) {
    console.warn('Clé API ORS non configurée');
    return null;
  }

  if (coordinates.length < 2) return null;

  const coordsArray = coordinates.map(c => [c.lng, c.lat]);

  try {
    const response = await fetch(
      `${ORS_BASE_URL}/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/geo+json',
        },
        body: JSON.stringify({
          coordinates: coordsArray,
          elevation: true,
          geometry: true,
        }),
        signal,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur ORS:', response.status, errText);
      throw new Error(`ORS API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Données ORS:', data);
    const feature = data.features[0];
    const geometry = feature.geometry as GeoJSON.LineString;

    const elevationProfile: ElevationPoint[] = [];
    let elevationGain = 0;
    let cumulativeDistance = 0;

    if (geometry.coordinates.length > 0) {
      const firstElev = geometry.coordinates[0][2] ?? 0;
      elevationProfile.push({ distance: 0, elevation: firstElev });

      for (let i = 1; i < geometry.coordinates.length; i++) {
        const prev: Coordinates = {
          lng: geometry.coordinates[i - 1][0],
          lat: geometry.coordinates[i - 1][1],
        };
        const curr: Coordinates = {
          lng: geometry.coordinates[i][0],
          lat: geometry.coordinates[i][1],
        };
        cumulativeDistance += haversineDistance(prev, curr);

        const elev = geometry.coordinates[i][2] ?? 0;
        const prevElev = geometry.coordinates[i - 1][2] ?? 0;
        const diff = elev - prevElev;
        if (diff > 0) elevationGain += diff;

        elevationProfile.push({ distance: cumulativeDistance, elevation: elev });
      }
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
      distance: feature.properties.segments[0].distance,
      duration: feature.properties.segments[0].duration,
      geometry,
      elevationProfile,
      elevationGain: Math.round(elevationGain),
    };

    return { route, elevation: elevationProfile };
  } catch (error) {
    console.error('Erreur calcul itinéraire:', error);
    return null;
  }
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