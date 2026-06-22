import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { getDatabase } from '../services/database';

interface PreferencesState {
  orsApiKey: string;
  isLoaded: boolean;
  loadPreferences: () => Promise<void>;
  setOrsApiKey: (key: string) => Promise<string | null>;
}

interface PreferenceRow {
  key: string;
  value: string;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  orsApiKey: '',
  isLoaded: false,

  loadPreferences: async () => {
    try {
      const db = await getDatabase();
      const rows = await db.select<PreferenceRow[]>(
        `SELECT key, value FROM preferences WHERE key = 'ors_api_key'`
      );

      if (rows.length > 0 && rows[0].value) {
        try {
          const decrypted = await invoke<string>('decrypt_value', { encoded: rows[0].value });
          console.log('Clé ORS déchiffrée avec succès');
          set({ orsApiKey: decrypted, isLoaded: true });
        } catch (err) {
          console.warn('Déchiffrement échoué, tentative clair:', err);
          set({ orsApiKey: rows[0].value, isLoaded: true });
        }
      } else {
        set({ orsApiKey: '', isLoaded: true });
      }
    } catch (err) {
      console.error('Erreur loadPreferences:', err);
      set({ orsApiKey: '', isLoaded: true });
    }
  },

  setOrsApiKey: async (key: string): Promise<string | null> => {
    try {
      const db = await getDatabase();

      let valueToStore: string;
      if (key) {
        try {
          valueToStore = await invoke<string>('encrypt_value', { plaintext: key });
        } catch (err) {
          console.warn('Chiffrement indisponible, stockage en clair:', err);
          valueToStore = key;
        }
      } else {
        valueToStore = '';
      }

      await db.execute(
        `INSERT INTO preferences (key, value) VALUES ('ors_api_key', $1)
         ON CONFLICT(key) DO UPDATE SET value = $1`,
        [valueToStore]
      );

      set({ orsApiKey: key });
      return null;
    } catch (err) {
      console.error('Erreur setOrsApiKey:', err);
      return String(err);
    }
  },
}));
