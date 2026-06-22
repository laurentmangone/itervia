import { useState, useCallback, useEffect } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { MapView } from './components/MapView';
import { RouteList } from './components/RouteList';
import { RouteEditor } from './components/RouteEditor';
import { ElevationProfile } from './components/ElevationProfile';
import { useRouteStore } from './store/useRouteStore';
import { calculateRoute, parseGPX, generateGPX, createElevationProfileFromGPX } from './services/routing';
import { Route, Coordinates } from './types';
import './App.css';

function App() {
  const { currentRoute, setCurrentRoute, addRoute, updateRoute, deleteRoute, loadRoutes, isLoaded } = useRouteStore();
  const [showEditor, setShowEditor] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleMapClick = useCallback(async (coordinates: Coordinates) => {
    if (currentRoute) {
      const newPoint = {
        id: crypto.randomUUID(),
        coordinates,
        order: currentRoute.points.length,
      };
      await useRouteStore.getState().addPoint(newPoint);
    } else {
      const newRoute: Route = {
        id: crypto.randomUUID(),
        name: '',
        points: [
          { id: crypto.randomUUID(), coordinates, order: 0 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addRoute(newRoute);
      setCurrentRoute(newRoute);
    }
  }, [currentRoute, setCurrentRoute, addRoute]);

  const handleCalculateRoute = async () => {
    if (!currentRoute || currentRoute.points.length < 2) return;
    setIsCalculating(true);

    const coords = currentRoute.points.map(p => p.coordinates);
    console.log('Calcul itinéraire pour:', coords);
    const result = await calculateRoute(coords);
    console.log('Résultat ORS:', result);

    if (result) {
      const updatedRoute = {
        ...currentRoute,
        ...result.route,
        id: currentRoute.id,
        points: currentRoute.points,
        name: currentRoute.name,
        elevationProfile: result.elevation,
        elevationGain: result.route.elevationGain,
        updatedAt: new Date(),
      };
      console.log('Route mise à jour:', updatedRoute);
      updateRoute(updatedRoute);
      setCurrentRoute(updatedRoute);
    } else {
      console.warn('Aucun résultat du calcul d\'itinéraire');
    }
    setIsCalculating(false);
  };

  const handleSelectRoute = (route: Route) => {
    console.log('Route sélectionnée:', route.id, 'points:', route.points?.length, 'geometry:', !!route.geometry);
    setCurrentRoute(route);
    setShowEditor(false);
  };

  const handleDeleteRoute = async (id: string) => {
    await deleteRoute(id);
  };

  const handleImportGPX = async (file: File) => {
    try {
      const { coords, elevations } = await parseGPX(file);
      if (coords.length < 2) return;

      // Create elevation profile from GPX data
      const gpxElevationProfile = createElevationProfileFromGPX(coords, elevations);
      
      // Calculate total elevation gain from GPX data
      let elevationGain = 0;
      for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) elevationGain += diff;
      }

      const route: Route = {
        id: crypto.randomUUID(),
        name: file.name.replace('.gpx', ''),
        points: coords.map((c, i) => ({
          id: crypto.randomUUID(),
          coordinates: c,
          order: i,
        })),
        elevationProfile: gpxElevationProfile,
        elevationGain: Math.round(elevationGain),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addRoute(route);
      setCurrentRoute(route);

      // Still call ORS to get the actual route geometry (snapped to roads)
      const calcResult = await calculateRoute(coords);
      if (calcResult) {
        const updatedRoute = {
          ...route,
          ...calcResult.route,
          id: route.id,
          points: route.points,
          name: route.name,
          // Keep the GPX elevation profile, don't use ORS elevations
          elevationProfile: gpxElevationProfile,
          elevationGain: Math.round(elevationGain),
          updatedAt: new Date(),
        };
        updateRoute(updatedRoute);
        setCurrentRoute(updatedRoute);
      }
    } catch (error) {
      console.error('Error importing GPX:', error);
      // TODO: Show error message to user
    }
  };

  const handleSaveRoute = (route: Route) => {
    updateRoute({ ...route, updatedAt: new Date() });
    setShowEditor(false);
  };

  const handleExportGPX = async () => {
    if (!currentRoute) return;
    const gpx = generateGPX(currentRoute);
    const path = await save({
      defaultPath: `${currentRoute.name || 'parcours'}.gpx`,
      filters: [{ name: 'GPX', extensions: ['gpx'] }],
    });
    if (path) {
      await writeTextFile(path, gpx);
    }
  };

  if (!isLoaded) {
    return (
      <div className="app loading">
        <div className="loading-spinner">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Itervia</h1>
        <div className="header-actions">
          {currentRoute && (
            <>
              <button className="btn-secondary" onClick={handleCalculateRoute} disabled={isCalculating || currentRoute.points.length < 2}>
                {isCalculating ? 'Calcul...' : 'Calculer itinéraire'}
              </button>
              <button className="btn-secondary" onClick={handleExportGPX} disabled={!currentRoute || (currentRoute.points.length === 0 && !currentRoute.geometry)}>
                Exporter GPX
              </button>
              <button className="btn-primary" onClick={() => setShowEditor(true)}>
                Éditer
              </button>
            </>
          )}
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <RouteList
            onSelectRoute={handleSelectRoute}
            onDeleteRoute={handleDeleteRoute}
            onImportGPX={handleImportGPX}
          />
        </aside>

        <main className="main-content">
          <MapView onMapClick={handleMapClick} />

          {currentRoute && currentRoute.elevationProfile && currentRoute.elevationProfile.length > 0 && (
            <div className="elevation-section">
              <ElevationProfile data={currentRoute.elevationProfile} />
            </div>
          )}
        </main>
      </div>

      {showEditor && currentRoute && (
        <RouteEditor
          onClose={() => setShowEditor(false)}
          onSave={handleSaveRoute}
        />
      )}
    </div>
  );
}

export default App;