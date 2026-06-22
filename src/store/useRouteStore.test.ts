import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouteStore } from './useRouteStore';
import { Route, RoutePoint } from '../types';

const { mockExecute, mockSelect } = vi.hoisted(() => ({
  mockExecute: vi.fn().mockResolvedValue(undefined),
  mockSelect: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/database', () => ({
  getDatabase: vi.fn().mockResolvedValue({
    execute: mockExecute,
    select: mockSelect,
  }),
}));

function createMockRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-1',
    name: 'Test Route',
    points: [
      { id: 'p1', coordinates: { lng: 4.35, lat: 50.85 }, order: 0 },
      { id: 'p2', coordinates: { lng: 4.40, lat: 50.90 }, order: 1 },
    ],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    distance: 5000,
    duration: 600,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useRouteStore.setState({ routes: [], currentRoute: null, isLoaded: false });
});

describe('useRouteStore', () => {
  describe('loadRoutes', () => {
    it('should load routes from database', async () => {
      mockSelect.mockResolvedValue([
        {
          id: 'route-1',
          name: 'Test Route',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          distance: 5000,
          duration: 600,
          elevation_gain: null,
          geometry: null,
          elevation_profile: null,
          point_id: 'p1',
          point_lng: 4.35,
          point_lat: 50.85,
          point_order: 0,
        },
        {
          id: 'route-1',
          name: 'Test Route',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          distance: 5000,
          duration: 600,
          elevation_gain: null,
          geometry: null,
          elevation_profile: null,
          point_id: 'p2',
          point_lng: 4.40,
          point_lat: 50.90,
          point_order: 1,
        },
      ]);

      await useRouteStore.getState().loadRoutes();

      const state = useRouteStore.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.routes).toHaveLength(1);
      expect(state.routes[0].points).toHaveLength(2);
    });

    it('should handle empty database', async () => {
      mockSelect.mockResolvedValue([]);

      await useRouteStore.getState().loadRoutes();

      expect(useRouteStore.getState().routes).toEqual([]);
      expect(useRouteStore.getState().isLoaded).toBe(true);
    });
  });

  describe('addRoute', () => {
    it('should insert route and points into database', async () => {
      const route = createMockRoute();

      await useRouteStore.getState().addRoute(route);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO routes'),
        expect.arrayContaining([route.id, route.name])
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO route_points'),
        expect.arrayContaining(['p1', 'route-1', 4.35, 50.85, 0])
      );
      expect(useRouteStore.getState().routes).toContainEqual(route);
    });

    it('should batch insert points in groups of 500', async () => {
      const points: RoutePoint[] = Array.from({ length: 600 }, (_, i) => ({
        id: `p${i}`,
        coordinates: { lng: 4.35 + i * 0.001, lat: 50.85 },
        order: i,
      }));
      const route = createMockRoute({ points });

      await useRouteStore.getState().addRoute(route);

      const routePointCalls = mockExecute.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO route_points')
      );
      expect(routePointCalls).toHaveLength(2);
    });
  });

  describe('updateRoute', () => {
    it('should update route in database and state', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      const updatedRoute = { ...route, name: 'Updated Route' };
      await useRouteStore.getState().updateRoute(updatedRoute);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE routes'),
        expect.arrayContaining(['Updated Route', route.id])
      );
      expect(useRouteStore.getState().routes[0].name).toBe('Updated Route');
      expect(useRouteStore.getState().currentRoute?.name).toBe('Updated Route');
    });
  });

  describe('deleteRoute', () => {
    it('should delete route and points from database', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().deleteRoute('route-1');

      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM route_points WHERE route_id = $1',
        ['route-1']
      );
      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM routes WHERE id = $1',
        ['route-1']
      );
      expect(useRouteStore.getState().routes).toHaveLength(0);
      expect(useRouteStore.getState().currentRoute).toBeNull();
    });

    it('should not clear currentRoute if deleting different route', async () => {
      const route1 = createMockRoute({ id: 'route-1', name: 'Route 1' });
      const route2 = createMockRoute({ id: 'route-2', name: 'Route 2' });
      useRouteStore.setState({ routes: [route1, route2], currentRoute: route1 });

      await useRouteStore.getState().deleteRoute('route-2');

      expect(useRouteStore.getState().currentRoute?.id).toBe('route-1');
      expect(useRouteStore.getState().routes).toHaveLength(1);
    });
  });

  describe('addPoint', () => {
    it('should add point to current route', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      const newPoint: RoutePoint = {
        id: 'p3',
        coordinates: { lng: 4.45, lat: 50.95 },
        order: 2,
      };

      await useRouteStore.getState().addPoint(newPoint);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO route_points'),
        ['p3', 'route-1', 4.45, 50.95, 2]
      );
      expect(useRouteStore.getState().currentRoute?.points).toHaveLength(3);
    });

    it('should do nothing if no current route', async () => {
      const newPoint: RoutePoint = {
        id: 'p3',
        coordinates: { lng: 4.45, lat: 50.95 },
        order: 2,
      };

      await useRouteStore.getState().addPoint(newPoint);

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('deletePoint', () => {
    it('should delete point and reorder remaining points', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().deletePoint('p1');

      expect(mockExecute).toHaveBeenCalledWith(
        'DELETE FROM route_points WHERE id = $1',
        ['p1']
      );
      const points = useRouteStore.getState().currentRoute?.points;
      expect(points).toHaveLength(1);
      expect(points?.[0].order).toBe(0);
      expect(points?.[0].id).toBe('p2');
    });
  });

  describe('reorderPoints', () => {
    it('should update point orders in database', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      const reordered = [
        { id: 'p2', coordinates: { lng: 4.40, lat: 50.90 }, order: 0 },
        { id: 'p1', coordinates: { lng: 4.35, lat: 50.85 }, order: 1 },
      ];

      await useRouteStore.getState().reorderPoints(reordered);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE route_points SET point_order'),
        expect.arrayContaining(['p2', 0, 'p1', 1, 'p2', 'p1'])
      );
      expect(useRouteStore.getState().currentRoute?.points[0].id).toBe('p2');
      expect(useRouteStore.getState().currentRoute?.points[1].id).toBe('p1');
    });
  });

  describe('setRouteName', () => {
    it('should update route name', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().setRouteName('New Name');

      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE routes SET name'),
        ['New Name', expect.any(String), 'route-1']
      );
      expect(useRouteStore.getState().currentRoute?.name).toBe('New Name');
    });
  });

  describe('reverseRoute', () => {
    it('should reverse point order', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().reverseRoute();

      const points = useRouteStore.getState().currentRoute?.points;
      expect(points?.[0].id).toBe('p2');
      expect(points?.[0].order).toBe(0);
      expect(points?.[1].id).toBe('p1');
      expect(points?.[1].order).toBe(1);
    });

    it('should do nothing with less than 2 points', async () => {
      const route = createMockRoute({
        points: [{ id: 'p1', coordinates: { lng: 4.35, lat: 50.85 }, order: 0 }],
      });
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().reverseRoute();

      expect(mockExecute).not.toHaveBeenCalledWith(
        expect.stringContaining('UPDATE route_points'),
        expect.anything()
      );
    });
  });

  describe('movePoint', () => {
    it('should move point up (direction -1)', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().movePoint('p2', -1);

      const points = useRouteStore.getState().currentRoute?.points;
      expect(points?.[0].id).toBe('p2');
      expect(points?.[0].order).toBe(0);
      expect(points?.[1].id).toBe('p1');
      expect(points?.[1].order).toBe(1);
    });

    it('should move point down (direction 1)', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().movePoint('p1', 1);

      const points = useRouteStore.getState().currentRoute?.points;
      expect(points?.[0].id).toBe('p2');
      expect(points?.[1].id).toBe('p1');
    });

    it('should not move point beyond bounds', async () => {
      const route = createMockRoute();
      useRouteStore.setState({ routes: [route], currentRoute: route });

      await useRouteStore.getState().movePoint('p1', -1);

      expect(useRouteStore.getState().currentRoute?.points[0].id).toBe('p1');
    });
  });

  describe('setCurrentRoute', () => {
    it('should set current route', () => {
      const route = createMockRoute();
      useRouteStore.getState().setCurrentRoute(route);
      expect(useRouteStore.getState().currentRoute).toBe(route);
    });

    it('should clear current route with null', () => {
      const route = createMockRoute();
      useRouteStore.setState({ currentRoute: route });
      useRouteStore.getState().setCurrentRoute(null);
      expect(useRouteStore.getState().currentRoute).toBeNull();
    });
  });

  describe('clearCurrentRoute', () => {
    it('should clear current route', () => {
      const route = createMockRoute();
      useRouteStore.setState({ currentRoute: route });
      useRouteStore.getState().clearCurrentRoute();
      expect(useRouteStore.getState().currentRoute).toBeNull();
    });
  });
});
