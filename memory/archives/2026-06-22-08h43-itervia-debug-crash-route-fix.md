---
date: 2026-06-22
heure: "08:43"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 08h43 — Itervia Debug crash + fix route display

## Resume
Debugging intensif de l'app desktop Itervia. Deux bugs critiques résolus : le crash via `tauri dev` (causé par le file watcher) et le tracé ORS qui ne s'affichait pas dans l'UI (ID mismatch). L'app est maintenant stable et le code est prêt pour tester le calcul d'itinéraire.

## Travail effectue
- Diagnostic du crash app : isolé le problème au file watcher de `tauri dev` qui killait le processus
- Solution crash : `npm run tauri:dev` avec `--no-watch`, testé stable 30s+
- Fix route ID mismatch : `calculateRoute()` créait un nouvel UUID → forcer l'ID original
- Fix handleImportGPX stale closure : appeler `calculateRoute` directement au lieu de `handleCalculateRoute`
- Création `.taurignore` pour exclure `target/` et `gen/` du watcher
- Ajout `ErrorBoundary` dans `main.tsx` pour capturer les erreurs React
- Ajout `window.onerror` dans `index.html` pour capturer les erreurs JS
- Ajout `devtools: true` dans la config fenêtre Tauri
- `useCallback` sur toutes les fonctions `useMap` pour éviter les boucles re-render
- Ref pour `onMapClick` dans `MapView.tsx` pour éviter les stale closures
- CSP mis à `null` dans `tauri.conf.json` (bloquait le HMR WebSocket)
- Permissions `core:window:default` et `core:event:default` ajoutées
- Suppression CSS externe unpkg de `index.html` (redondant)

## Decisions
- **`npm run tauri:dev` (--no-watch)** : Le file watcher standard de `tauri dev` tue le processus enfant de manière intempestive. `--no-watch` résout le problème.
- **`.taurignore`** : Exclure `target/` et `gen/` du watcher comme backup
- **Forcer l'ID original** : `calculateRoute()` génère un nouvel UUID, il faut écraser `id` et `points` après le merge pour garder la route existante
- **Appeler `calculateRoute` directement** : Éviter `handleCalculateRoute` dans `handleImportGPX` à cause du stale closure sur `currentRoute`

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Scaffold Tauri v2, carte MapLibre GL, sidebar, store Zustand, recherche lieu, GPX, crash résolu, route display fixé (code)
- En cours : Tester visuellement le calcul ORS dans l'UI

## Prochaines etapes
1. Tester le calcul itinéraire ORS dans l'UI (vérifier que le tracé s'affiche)
2. Ajouter profil altimétrique
3. Tester export/import GPX complet
4. Sauvegarde locale parcours (localStorage ou SQLite)

## Fichiers modifies
- `src/App.tsx` — modifié (handleCalculateRoute ID fix, handleImportGPX stale closure fix)
- `src/main.tsx` — modifié (ErrorBoundary ajouté)
- `index.html` — modifié (window.onerror ajouté)
- `src/hooks/useMap.ts` — modifié (useCallback sur toutes les fonctions)
- `src/components/MapView.tsx` — modifié (ref pour onMapClick)
- `src-tauri/tauri.conf.json` — modifié (csp: null, devtools: true)
- `src-tauri/capabilities/default.json` — modifié (permissions ajoutées)
- `src-tauri/.taurignore` — créé (exclure target/ et gen/)
- `package.json` — modifié (script tauri:dev ajouté)
- `memory/projets/Itervia/contexte.md` — modifié
- `memory/projets/Itervia/historique.md` — modifié

## Assets (URLs)
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
