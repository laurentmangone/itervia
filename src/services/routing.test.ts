import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGPX, parseGPX, createElevationProfileFromGPX, calculateRoute } from './routing';
import { Route, Coordinates } from '../types';

function createMockRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'test-id',
    name: 'Test Route',
    points: [
      { id: 'p1', coordinates: { lng: 4.35, lat: 50.85 }, order: 0 },
      { id: 'p2', coordinates: { lng: 4.40, lat: 50.90 }, order: 1 },
    ],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('generateGPX', () => {
  it('should generate valid GPX with geometry coordinates', () => {
    const route = createMockRoute({
      geometry: {
        type: 'LineString',
        coordinates: [
          [4.35, 50.85, 100],
          [4.40, 50.90, 150],
        ],
      },
    });

    const gpx = generateGPX(route);

    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1" creator="Itervia"');
    expect(gpx).toContain('<name>Test Route</name>');
    expect(gpx).toContain('<trkpt lat="50.85" lon="4.35">');
    expect(gpx).toContain('<ele>100</ele>');
    expect(gpx).toContain('<trkpt lat="50.9" lon="4.4">');
    expect(gpx).toContain('<ele>150</ele>');
    expect(gpx).toContain('</trkseg>');
    expect(gpx).toContain('</gpx>');
  });

  it('should fallback to points when no geometry', () => {
    const route = createMockRoute({ geometry: undefined });

    const gpx = generateGPX(route);

    expect(gpx).toContain('<trkpt lat="50.85" lon="4.35">');
    expect(gpx).toContain('<trkpt lat="50.9" lon="4.4">');
  });

  it('should escape XML special characters in route name', () => {
    const route = createMockRoute({ name: 'Route <test> & "example"' });

    const gpx = generateGPX(route);

    expect(gpx).toContain('<name>Route &lt;test&gt; &amp; &quot;example&quot;</name>');
  });

  it('should sort points by order when using points fallback', () => {
    const route = createMockRoute({
      geometry: undefined,
      points: [
        { id: 'p2', coordinates: { lng: 4.40, lat: 50.90 }, order: 1 },
        { id: 'p1', coordinates: { lng: 4.35, lat: 50.85 }, order: 0 },
      ],
    });

    const gpx = generateGPX(route);
    const p1Index = gpx.indexOf('lat="50.85"');
    const p2Index = gpx.indexOf('lat="50.9"');

    expect(p1Index).toBeLessThan(p2Index);
  });
});

describe('parseGPX', () => {
  function createGPXFile(content: string): File {
    return new File([content], 'test.gpx', { type: 'application/gpx+xml' });
  }

  it('should parse GPX with elevations', async () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Itervia" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test</name>
    <trkseg>
      <trkpt lat="50.85" lon="4.35"><ele>100</ele></trkpt>
      <trkpt lat="50.90" lon="4.40"><ele>150</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const file = createGPXFile(gpxContent);
    const result = await parseGPX(file);

    expect(result.coords).toHaveLength(2);
    expect(result.coords[0]).toEqual({ lng: 4.35, lat: 50.85 });
    expect(result.coords[1]).toEqual({ lng: 4.40, lat: 50.90 });
    expect(result.elevations).toEqual([100, 150]);
  });

  it('should parse GPX without elevations (default 0)', async () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>
      <trkpt lat="50.85" lon="4.35"></trkpt>
      <trkpt lat="50.90" lon="4.40"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const file = createGPXFile(gpxContent);
    const result = await parseGPX(file);

    expect(result.coords).toHaveLength(2);
    expect(result.elevations).toEqual([0, 0]);
  });

  it('should throw on invalid XML', async () => {
    const file = createGPXFile('not valid xml');
    await expect(parseGPX(file)).rejects.toThrow('Invalid XML file');
  });

  it('should throw when no track points found', async () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg></trkseg></trk>
</gpx>`;

    const file = createGPXFile(gpxContent);
    await expect(parseGPX(file)).rejects.toThrow('No track points found');
  });

  it('should skip points with invalid coordinates', async () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>
      <trkpt lat="50.85" lon="4.35"><ele>100</ele></trkpt>
      <trkpt lat="abc" lon="xyz"><ele>200</ele></trkpt>
      <trkpt lat="50.90" lon="4.40"><ele>150</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const file = createGPXFile(gpxContent);
    const result = await parseGPX(file);

    expect(result.coords).toHaveLength(2);
    expect(result.elevations).toEqual([100, 150]);
  });

  it('should handle wpt elements', async () => {
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="50.85" lon="4.35"><ele>100</ele></wpt>
  <wpt lat="50.90" lon="4.40"><ele>150</ele></wpt>
</gpx>`;

    const file = createGPXFile(gpxContent);
    const result = await parseGPX(file);

    expect(result.coords).toHaveLength(2);
  });
});

describe('createElevationProfileFromGPX', () => {
  it('should return empty array for empty coords', () => {
    expect(createElevationProfileFromGPX([], [])).toEqual([]);
  });

  it('should create profile with single point', () => {
    const coords: Coordinates[] = [{ lng: 4.35, lat: 50.85 }];
    const elevations = [100];

    const profile = createElevationProfileFromGPX(coords, elevations);

    expect(profile).toEqual([{ distance: 0, elevation: 100 }]);
  });

  it('should calculate cumulative distances', () => {
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
      { lng: 4.45, lat: 50.95 },
    ];
    const elevations = [100, 150, 200];

    const profile = createElevationProfileFromGPX(coords, elevations);

    expect(profile).toHaveLength(3);
    expect(profile[0].distance).toBe(0);
    expect(profile[1].distance).toBeGreaterThan(0);
    expect(profile[2].distance).toBeGreaterThan(profile[1].distance);
    expect(profile[0].elevation).toBe(100);
    expect(profile[1].elevation).toBe(150);
    expect(profile[2].elevation).toBe(200);
  });

  it('should handle missing elevations (default 0)', () => {
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
    ];
    const elevations: number[] = [];

    const profile = createElevationProfileFromGPX(coords, elevations);

    expect(profile[0].elevation).toBe(0);
    expect(profile[1].elevation).toBe(0);
  });
});

describe('calculateRoute', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return null when no API key', async () => {
    vi.stubEnv('VITE_ORS_API_KEY', '');
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
    ];

    const result = await calculateRoute(coords);
    expect(result).toBeNull();
    vi.unstubAllEnvs();
  });

  it('should return null when less than 2 coordinates', async () => {
    const coords: Coordinates[] = [{ lng: 4.35, lat: 50.85 }];

    const result = await calculateRoute(coords);
    expect(result).toBeNull();
  });

  it('should call ORS API with correct parameters', async () => {
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
    ];

    const mockResponse = {
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [4.35, 50.85, 100],
                [4.40, 50.90, 150],
              ],
            },
            properties: {
              segments: [{ distance: 5000, duration: 600 }],
            },
          },
        ],
      }),
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await calculateRoute(coords);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openrouteservice.org/v2/directions/cycling-regular/geojson',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Accept': 'application/geo+json',
        }),
        body: JSON.stringify({
          coordinates: [[4.35, 50.85], [4.40, 50.90]],
          elevation: true,
          geometry: true,
        }),
      })
    );

    expect(result).not.toBeNull();
    expect(result!.route.distance).toBe(5000);
    expect(result!.route.duration).toBe(600);
    expect(result!.elevation).toHaveLength(2);
    expect(result!.elevation[0]).toEqual({ distance: 0, elevation: 100 });
    expect(result!.elevation[1].elevation).toBe(150);
  });

  it('should return null on API error', async () => {
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const result = await calculateRoute(coords);
    expect(result).toBeNull();
  });

  it('should support AbortController signal', async () => {
    const coords: Coordinates[] = [
      { lng: 4.35, lat: 50.85 },
      { lng: 4.40, lat: 50.90 },
    ];

    const controller = new AbortController();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: { type: 'LineString', coordinates: [[4.35, 50.85, 100], [4.40, 50.90, 150]] },
            properties: { segments: [{ distance: 5000, duration: 600 }] },
          },
        ],
      }),
    });

    await calculateRoute(coords, 'cycling-regular', controller.signal);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });
});
