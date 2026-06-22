import { useState, useEffect } from 'react';
import { useRouteStore } from '../store/useRouteStore';
import { Route } from '../types';

interface RouteEditorProps {
  onClose: () => void;
  onSave: (route: Route) => void;
}

export function RouteEditor({ onClose, onSave }: RouteEditorProps) {
  const { currentRoute, removeRoutePoint, reverseRoute, clearCurrentRoute, setRouteName, movePoint } = useRouteStore();
  const [name, setName] = useState(currentRoute?.name || '');

  useEffect(() => {
    if (currentRoute) {
      setName(currentRoute.name || '');
    }
  }, [currentRoute]);

  const handleSave = () => {
    if (currentRoute) {
      setRouteName(name);
      onSave(currentRoute);
    }
    onClose();
  };

  if (!currentRoute) return null;

  return (
    <div className="route-editor">
      <div className="route-editor-header">
        <h3>Éditer le parcours</h3>
        <button className="btn-icon" onClick={onClose} title="Fermer">✕</button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du parcours"
        className="route-name-input"
      />

      {currentRoute.points.length > 0 && (
        <div className="route-stats">
          <span>{currentRoute.distance ? `${(currentRoute.distance / 1000).toFixed(1)} km` : '—'}</span>
          <span>{currentRoute.elevationGain ? `${Math.round(currentRoute.elevationGain)}m D+` : '—'}</span>
          <span>{currentRoute.duration ? `${Math.round(currentRoute.duration / 60)} min` : '—'}</span>
        </div>
      )}

      <ul className="route-points">
        {currentRoute.points.map((point, index) => (
          <li key={point.id} className="route-point">
            <span className="point-index">{index + 1}</span>
            <span className="point-coords">
              {point.coordinates.lat.toFixed(5)}, {point.coordinates.lng.toFixed(5)}
            </span>
            <div className="point-actions">
              {index > 0 && (
                <button className="btn-icon" onClick={() => movePoint(point.id, -1)} title="Monter">↑</button>
              )}
              {index < currentRoute.points.length - 1 && (
                <button className="btn-icon" onClick={() => movePoint(point.id, 1)} title="Descendre">↓</button>
              )}
              <button className="btn-icon btn-danger" onClick={() => removeRoutePoint(point.id)} title="Supprimer">🗑</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="route-editor-actions">
        <button className="btn-secondary" onClick={reverseRoute} disabled={currentRoute.points.length < 2}>
          Inverser le sens
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={currentRoute.points.length < 2}>
          Enregistrer
        </button>
        <button className="btn-secondary" onClick={() => { clearCurrentRoute(); onClose(); }}>
          Annuler
        </button>
      </div>
    </div>
  );
}