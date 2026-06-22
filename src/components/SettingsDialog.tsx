import { useState, useEffect } from 'react';
import { usePreferencesStore } from '../store/usePreferencesStore';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const orsApiKey = usePreferencesStore((s) => s.orsApiKey);
  const setOrsApiKey = usePreferencesStore((s) => s.setOrsApiKey);
  const [apiKey, setApiKey] = useState(orsApiKey);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setApiKey(orsApiKey);
  }, [orsApiKey]);

  const handleSave = async () => {
    setError('');
    const err = await setOrsApiKey(apiKey);
    if (err) {
      setError(err);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-dialog">
        <div className="settings-header">
          <h3>Préférences</h3>
          <button className="btn-icon" onClick={onClose} title="Fermer">✕</button>
        </div>

        <div className="settings-body">
          <div className="settings-group">
            <label className="settings-label">
              Clé API OpenRouteService
            </label>
            <p className="settings-hint">
              Obtenez votre clé sur <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noopener noreferrer">openrouteservice.org</a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
              placeholder="Votre clé API ORS"
              className="settings-input"
            />
          </div>
        </div>

        <div className="settings-actions">
          {error && <span className="settings-error">{error}</span>}
          {saved && <span className="settings-saved">Enregistré ✓</span>}
          <button className="btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
