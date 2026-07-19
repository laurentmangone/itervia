import { useMemo } from 'react';
import { useRouteStore } from '../store/useRouteStore';
import { Route } from '../types';

interface RouteListProps {
  onSelectRoute: (route: Route) => void;
  onDeleteRoute: (id: string) => void;
  onImportGPX: (file: File) => Promise<void>;
  onNewRoute: () => void;
}

export function RouteList({ onSelectRoute, onDeleteRoute, onImportGPX, onNewRoute }: RouteListProps) {
  const routes = useRouteStore((s) => s.routes);

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [routes]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImportGPX(file);
      e.target.value = '';
    }
  };

  return (
    <div className="route-list">
      <div className="route-list-header">
        <h3>Mes parcours ({routes.length})</h3>
        <div className="route-list-actions">
          <button className="btn-primary" onClick={onNewRoute}>
            Nouveau parcours
          </button>
          <label className="btn-secondary import-label">
            Importer GPX
            <input type="file" accept=".gpx" onChange={handleImport} hidden />
          </label>
        </div>
      </div>

      {routes.length === 0 ? (
        <p className="empty-state">Aucun parcours. Créez-en un ou importez un fichier GPX.</p>
      ) : (
        <ul>
          {sortedRoutes.map((route) => (
            <li key={route.id} className="route-item">
              <div className="route-info" onClick={() => onSelectRoute(route)}>
                <strong>{route.name || `Parcours du ${new Date(route.createdAt).toLocaleDateString()}`}</strong>
                <span className="route-meta">
                  {route.distance ? `${(route.distance / 1000).toFixed(1)} km` : ''}
                  {route.elevationGain ? ` • ${Math.round(route.elevationGain)}m D+` : ''}
                </span>
                <small>{new Date(route.updatedAt).toLocaleString()}</small>
              </div>
              <button
                className="btn-icon btn-danger"
                onClick={(e) => { e.stopPropagation(); onDeleteRoute(route.id); }}
                title="Supprimer"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}