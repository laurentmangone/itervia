# Itervia — Historique des sessions

## Session 1 — 2026-06-21
**Initialisation du projet**
- Création architecture MVP pour app desktop type OpenRunner
- Nom choisi: Itervia (Itinéra + Via)
- Stack validée: Tauri v2 + React + TypeScript + MapLibre GL JS + openrouteservice
- Phases de développement définies (4 phases sur 7-10 semaines)
- Fichier contexte.md créé

## Session 2 — 2026-06-21 22h50
**Implémentation MVP technique**
- Scaffold complet Tauri v2 + React + TypeScript + Vite
- Intégration MapLibre GL JS (tuiles CartoDB Positron)
- Store Zustand, service API ORS (POST), géocodage Nominatim
- Composants: MapView, RouteList, RouteEditor, ElevationProfile
- Export/Import GPX, CSS responsive
- Problème: calcul itinéraire ne s'affiche pas dans l'UI (API OK en curl)
- [Archive](../../archives/2026-06-21-22h50-itervia-mvp-technique.md)

## Session 3 — 2026-06-22
**Debugging crash app + route display fix**
- **Crash résolu** : `tauri dev` file watcher tuait l'app. Solution: `npm run tauri:dev` (--no-watch). Testé, stable 30s+.
- **Route ID mismatch résolu** : `calculateRoute()` créait un nouvel UUID → `addRoute` au lieu de `updateRoute`. Fix: forcer l'ID original.
- **Import GPX fix** : `handleImportGPX` appelait `handleCalculateRoute()` avec `currentRoute` stale. Fix: appeler `calculateRoute` directement.
- `.taurignore` ajouté pour exclure `target/` et `gen/` du watcher.
- `devtools: true` ajouté à la config fenêtre pour debugging.
- `ErrorBoundary` et `window.onerror` ajoutés pour capturer les erreurs React/JS.
- Reste: tester visuellement le calcul ORS dans l'UI, profil altimétrique, GPX complet.
- [Archive](../../archives/2026-06-22-08h43-itervia-debug-crash-route-fix.md)

## Session 4 — 2026-06-22 21h00
**Test calcul ORS validé**
- Calcul d'itinéraire ORS testé et fonctionnel — le tracé s'affiche sur la carte
- Documenté le lancement correct : `npm run tauri:dev` (--no-watch)
- Build TypeScript vérifié — pas d'erreur
- [Archive](../../archives/2026-06-22-21h00-itervia-test-calcul-ors.md)

## Session 5 — 2026-06-22 09h21
**Profil altimétrique**
- Extraction des altitudes depuis la réponse ORS (3ème coordonnée)
- Calcul de l'elevationGain (D+) et construction du tableau ElevationPoint[]
- GPX import/export avec balises `<ele>`
- Test validé : le profil altimétrique s'affiche sous la carte
- [Archive](../../archives/2026-06-22-09h21-itervia-profil-altimetrique.md)

## Session 6 — 2026-06-22 08h30
**Export/Import GPX complet avec altitudes**
- Fix critique : altitudes GPX originales préservées lors de l'import (plus de discard)
- Validation XML ajoutée : détection erreurs parse + vérification trackpoints
- Fix bug latitude 0 : condition `if (lat && lng)` → `if (!isNaN(lat) && !isNaN(lng))`
- XML escaping pour noms de routes dans export GPX (caractères spéciaux)
- Suppression `.geojson` de l'accept input (pas de parser GeoJSON)
- Nouvelle fonction `createElevationProfileFromGPX()` pour calculer distances cumulées
- Build TypeScript vérifié — pas d'erreur
- [Archive](../../archives/2026-06-22-08h30-itervia-export-import-gpx-altitudes.md)

## Session 7 — 2026-06-22 09h00
**Sauvegarde locale SQLite**
- Intégration tauri-plugin-sql avec SQLite
- Schema normalisé : tables routes + route_points avec foreign key
- Geometry et elevation_profile stockés en JSON TEXT
- Migration 3 tables : routes, route_points, indexes
- Store Zustand refactorisé avec actions async (write SQLite first, then update state)
- Service database.ts avec singleton pour connexion
- App.tsx : chargement routes au démarrage via loadRoutes()
- Permissions SQL ajoutées aux capabilities
- Build TypeScript vérifié — pas d'erreur
- [Archive](../../archives/2026-06-22-09h00-itervia-sauvegarde-sqlite.md)

## Session 8 — 2026-06-22 09h15
**Session complète GPX + SQLite**
- Test export/import GPX complet avec préservation des altitudes
- Validation XML et gestion erreurs pour import GPX
- Fix bug latitude 0 dans parseGPX
- XML escaping pour noms de routes dans export GPX
- Intégration complète SQLite avec schema normalisé
- Refactorisation store Zustand avec actions async
- Toutes fonctionnalités MVP technique validées et persistées
- [Archive](../../archives/2026-06-22-09h15-itervia-session-complete.md)

## Session 9 — 2026-06-22 10h00
**GitHub + Corrections exports**
- Créé repository GitHub `laurentmangone/itervia` et poussé le code
- Corrigé bug ajout de points sur la carte (handleMapClick appelait pas addRoute)
- Corrigé export GPX pour fonctionner sans géométrie ORS
- Ajouté tauri-plugin-dialog et tauri-plugin-fs pour dialogue "Enregistrer sous" natif
- Configuré capabilities Tauri pour dialog et fs
- [Archive](../../archives/2026-06-22-10h00-itervia-github-corrections-export.md)

## Session 10 — 2026-06-22 12h20
**Optimisation des performances**
- Corrections critiques (P0) : crash elevation, N+1 query, insertions séquentielles
- Améliorations importantes (P1) : sélecteurs Zustand, AbortController, useMemo
- Optimisations moyennes (P2) : itération canvas, sort immutable, nettoyage console.log
- Toutes les optimisations validées et commitées
- [Archive](../../archives/2026-06-22-12h20-itervia-optimisation-performances.md)

## Session 11 — 2026-06-22 13h35
**Tests unitaires + Distribution**
- Installation Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- 39 tests : routing.ts (19) + useRouteStore.ts (20)
- Bundle identifier corrigé (com.itervia.app → com.itervia.desktop)
- Build Tauri : Itervia.app + Itervia_0.1.0_aarch64.dmg
- [Archive](../../archives/2026-06-22-13h35-itervia-tests-distribution.md)

## Session 12 — 2026-06-22
**Code splitting maplibre-gl**
- Config Vite `manualChunks` pour isoler maplibre-gl
- Lazy loading MapView avec React.lazy + Suspense
- Build vérifié : app principale 54 KB gzip (vs ~270 KB avant)

## Session 13 — 2026-06-22
**Fix distance + D+ altitude**
- Distance : utilisation distance cumulée (haversine) au lieu de `segments[0].distance` ORS
- D+ : seuil adaptatif de 5m pour filtrer bruit altimétrique SRTM
- Résultat : 48m vs 50m OpenRunner (écart 4%, marge d'erreur acceptable)
- [Archive](../../archives/2026-06-22-15h00-itervia-bundle-optimisation-distance-dplus.md)

## Session 14 — 2026-06-22 16h30
**Waypoint management (drag, insert, delete)**
- Migration markers GeoJSON → markers DOM pour drag natif + bouton delete
- Insertion de points entre deux existants via clic sur la ligne d'itinéraire
- Snap des points insérés sur géométrie ORS existante
- Debounce clic pour éviter doubles ajouts
- [Archive](../../archives/2026-06-22-16h30-itervia-waypoint-management.md)

## Session 15 — 2026-06-22 18h55
**Préférences utilisateur + Chiffrement API key + ORS via Rust**
- Store `usePreferencesStore` (Zustand + SQLite) pour clé API ORS
- Dialog ⚙ Settings pour configurer la clé
- Chiffrement AES-256-GCM côté Rust (crypto.rs, clé dérivée hostname)
- Appel ORS via Rust (reqwest) pour éviter CORS en dev
- Migration v4 SQLite : table preferences
- Fix erreurs TS pré-existantes dans useMap.ts
- [Archive](../../archives/2026-06-22-18h55-itervia-prefs-chiffrement-ors-rust.md)