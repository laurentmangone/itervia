export interface Coordinates {
  lng: number;
  lat: number;
}

export interface RoutePoint {
  id: string;
  coordinates: Coordinates;
  order: number;
}

export interface Route {
  id: string;
  name: string;
  points: RoutePoint[];
  createdAt: Date;
  updatedAt: Date;
  distance?: number;
  elevationGain?: number;
  duration?: number;
  geometry?: GeoJSON.LineString;
  elevationProfile?: ElevationPoint[];
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
}

export interface MapState {
  center: Coordinates;
  zoom: number;
}

export interface AppState {
  routes: Route[];
  currentRoute: Route | null;
  mapState: MapState;
  isLoading: boolean;
  error: string | null;
}