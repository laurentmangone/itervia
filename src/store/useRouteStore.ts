import { create } from 'zustand';
import { Route, RoutePoint, Coordinates } from '../types';
import { getDatabase } from '../services/database';

interface RouteState {
  routes: Route[];
  currentRoute: Route | null;
  isLoaded: boolean;

  loadRoutes: () => Promise<void>;
  addRoute: (route: Route) => Promise<void>;
  updateRoute: (route: Route) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  setCurrentRoute: (route: Route | null) => void;
  addPoint: (point: RoutePoint) => Promise<void>;
  updatePoint: (pointId: string, coordinates: Coordinates) => Promise<void>;
  deletePoint: (pointId: string) => Promise<void>;
  reorderPoints: (points: RoutePoint[]) => Promise<void>;
  setRouteName: (name: string) => Promise<void>;
  updateRoutePoint: (pointId: string, updates: Partial<RoutePoint>) => Promise<void>;
  removeRoutePoint: (pointId: string) => Promise<void>;
  reverseRoute: () => Promise<void>;
  clearCurrentRoute: () => void;
  movePoint: (pointId: string, direction: number) => Promise<void>;
}

interface RouteRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  distance: number | null;
  duration: number | null;
  elevation_gain: number | null;
  geometry: string | null;
  elevation_profile: string | null;
}

interface RoutePointRow {
  id: string;
  route_id: string;
  lng: number;
  lat: number;
  point_order: number;
}

function rowToRoute(row: RouteRow, points: RoutePoint[]): Route {
  return {
    id: row.id,
    name: row.name,
    points,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    distance: row.distance ?? undefined,
    duration: row.duration ?? undefined,
    elevationGain: row.elevation_gain ?? undefined,
    geometry: row.geometry ? JSON.parse(row.geometry) : undefined,
    elevationProfile: row.elevation_profile ? JSON.parse(row.elevation_profile) : undefined,
  };
}

async function loadRoutePoints(routeId: string): Promise<RoutePoint[]> {
  const db = await getDatabase();
  const rows = await db.select<RoutePointRow[]>(
    'SELECT * FROM route_points WHERE route_id = $1 ORDER BY point_order',
    [routeId]
  );
  return rows.map((row) => ({
    id: row.id,
    coordinates: { lng: row.lng, lat: row.lat },
    order: row.point_order,
  }));
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  currentRoute: null,
  isLoaded: false,

  loadRoutes: async () => {
    const db = await getDatabase();
    const rows = await db.select<RouteRow[]>('SELECT * FROM routes ORDER BY updated_at DESC');
    
    const routes: Route[] = [];
    for (const row of rows) {
      const points = await loadRoutePoints(row.id);
      routes.push(rowToRoute(row as RouteRow, points));
    }
    
    set({ routes, isLoaded: true });
  },

  addRoute: async (route) => {
    const db = await getDatabase();

    await db.execute(
      `INSERT INTO routes (id, name, created_at, updated_at, distance, duration, elevation_gain, geometry, elevation_profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        route.id,
        route.name,
        route.createdAt.toISOString(),
        route.updatedAt.toISOString(),
        route.distance ?? null,
        route.duration ?? null,
        route.elevationGain ?? null,
        route.geometry ? JSON.stringify(route.geometry) : null,
        route.elevationProfile ? JSON.stringify(route.elevationProfile) : null,
      ]
    );

    for (const point of route.points) {
      await db.execute(
        `INSERT INTO route_points (id, route_id, lng, lat, point_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [point.id, route.id, point.coordinates.lng, point.coordinates.lat, point.order]
      );
    }

    set((state) => ({ routes: [...state.routes, route] }));
  },

  updateRoute: async (route) => {
    const db = await getDatabase();

    await db.execute(
      `UPDATE routes
       SET name = $1, updated_at = $2, distance = $3, duration = $4,
           elevation_gain = $5, geometry = $6, elevation_profile = $7
       WHERE id = $8`,
      [
        route.name,
        route.updatedAt.toISOString(),
        route.distance ?? null,
        route.duration ?? null,
        route.elevationGain ?? null,
        route.geometry ? JSON.stringify(route.geometry) : null,
        route.elevationProfile ? JSON.stringify(route.elevationProfile) : null,
        route.id,
      ]
    );

    set((state) => ({
      routes: state.routes.map((r) => (r.id === route.id ? route : r)),
      currentRoute: state.currentRoute?.id === route.id ? route : state.currentRoute,
    }));
  },

  deleteRoute: async (id) => {
    const db = await getDatabase();
    await db.execute('DELETE FROM route_points WHERE route_id = $1', [id]);
    await db.execute('DELETE FROM routes WHERE id = $1', [id]);

    set((state) => ({
      routes: state.routes.filter((r) => r.id !== id),
      currentRoute: state.currentRoute?.id === id ? null : state.currentRoute,
    }));
  },

  setCurrentRoute: (route) => set({ currentRoute: route }),

  addPoint: async (point) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    await db.execute(
      `INSERT INTO route_points (id, route_id, lng, lat, point_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [point.id, state.currentRoute.id, point.coordinates.lng, point.coordinates.lat, point.order]
    );

    const newPoints = [...state.currentRoute.points, point].sort((a, b) => a.order - b.order);
    const updatedRoute = { ...state.currentRoute, points: newPoints, updatedAt: new Date() };
    
    // Update route in SQLite
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  updatePoint: async (pointId, coordinates) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    await db.execute(
      'UPDATE route_points SET lng = $1, lat = $2 WHERE id = $3',
      [coordinates.lng, coordinates.lat, pointId]
    );

    const newPoints = state.currentRoute.points.map((p) =>
      p.id === pointId ? { ...p, coordinates } : p
    );
    const updatedRoute = { ...state.currentRoute, points: newPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  deletePoint: async (pointId) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    await db.execute('DELETE FROM route_points WHERE id = $1', [pointId]);

    const newPoints = state.currentRoute.points
      .filter((p) => p.id !== pointId)
      .map((p, i) => ({ ...p, order: i }));
    
    // Update order in SQLite
    for (const point of newPoints) {
      await db.execute(
        'UPDATE route_points SET point_order = $1 WHERE id = $2',
        [point.order, point.id]
      );
    }

    const updatedRoute = { ...state.currentRoute, points: newPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  reorderPoints: async (points) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    
    // Update order in SQLite
    for (const point of points) {
      await db.execute(
        'UPDATE route_points SET point_order = $1 WHERE id = $2',
        [point.order, point.id]
      );
    }

    const updatedRoute = { ...state.currentRoute, points, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  setRouteName: async (name) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    const updatedRoute = { ...state.currentRoute, name, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET name = $1, updated_at = $2 WHERE id = $3',
      [name, updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  updateRoutePoint: async (pointId, updates) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    const newPoints = state.currentRoute.points.map((p) =>
      p.id === pointId ? { ...p, ...updates } : p
    );
    
    // Update in SQLite if coordinates changed
    if (updates.coordinates) {
      await db.execute(
        'UPDATE route_points SET lng = $1, lat = $2 WHERE id = $3',
        [updates.coordinates.lng, updates.coordinates.lat, pointId]
      );
    }

    const updatedRoute = { ...state.currentRoute, points: newPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  removeRoutePoint: async (pointId) => {
    const state = get();
    if (!state.currentRoute) return;

    const db = await getDatabase();
    await db.execute('DELETE FROM route_points WHERE id = $1', [pointId]);

    const newPoints = state.currentRoute.points
      .filter((p) => p.id !== pointId)
      .map((p, i) => ({ ...p, order: i }));
    
    // Update order in SQLite
    for (const point of newPoints) {
      await db.execute(
        'UPDATE route_points SET point_order = $1 WHERE id = $2',
        [point.order, point.id]
      );
    }

    const updatedRoute = { ...state.currentRoute, points: newPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  reverseRoute: async () => {
    const state = get();
    if (!state.currentRoute || state.currentRoute.points.length < 2) return;

    const reversedPoints = [...state.currentRoute.points].reverse().map((p, i) => ({ ...p, order: i }));
    
    const db = await getDatabase();
    
    // Update order in SQLite
    for (const point of reversedPoints) {
      await db.execute(
        'UPDATE route_points SET point_order = $1 WHERE id = $2',
        [point.order, point.id]
      );
    }

    const updatedRoute = { ...state.currentRoute, points: reversedPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },

  clearCurrentRoute: () => set({ currentRoute: null }),

  movePoint: async (pointId, direction) => {
    const state = get();
    if (!state.currentRoute) return;

    const index = state.currentRoute.points.findIndex((p) => p.id === pointId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.currentRoute.points.length) return;

    const newPoints = [...state.currentRoute.points];
    const [removed] = newPoints.splice(index, 1);
    newPoints.splice(newIndex, 0, removed);
    const reorderedPoints = newPoints.map((p, i) => ({ ...p, order: i }));
    
    const db = await getDatabase();
    
    // Update order in SQLite
    for (const point of reorderedPoints) {
      await db.execute(
        'UPDATE route_points SET point_order = $1 WHERE id = $2',
        [point.order, point.id]
      );
    }

    const updatedRoute = { ...state.currentRoute, points: reorderedPoints, updatedAt: new Date() };
    
    await db.execute(
      'UPDATE routes SET updated_at = $1 WHERE id = $2',
      [updatedRoute.updatedAt.toISOString(), updatedRoute.id]
    );

    set({
      currentRoute: updatedRoute,
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    });
  },
}));