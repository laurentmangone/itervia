---
date: 2026-06-22
heure: "12:20"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 12h20 — Itervia Optimisation des performances

## Resume
Session d'optimisation des performances de l'application Itervia. Correction des problèmes critiques (P0), améliorations importantes (P1) et optimisations moyennes (P2) sur le store Zustand, les composants React, et les appels API.

## Travail effectue

### P0 — Corrections critiques
- **ElevationProfile.tsx** : Remplacé `Math.min(...elevations)` / `Math.max(...elevations)` par une boucle `for` pour éviter le stack overflow sur les grands tableaux (>65K points)
- **useRouteStore.ts** : Eliminé le pattern N+1 query dans `loadRoutes` — un seul `LEFT JOIN route_points` au lieu d'1 query par route
- **useRouteStore.ts** : Insertion batch de points via `INSERT INTO ... VALUES (...), (...)` au lieu d'1 INSERT par point
- **useRouteStore.ts** : Nouvelle fonction `batchUpdatePointOrder` utilisant `CASE WHEN` pour les updates ORDER BY — 1 UPDATE au lieu de N

### P1 — Améliorations importantes
- **App.tsx** : Selecteurs Zustand individuels (`useRouteStore((s) => s.currentRoute)`) au lieu du destructuring complet
- **routing.ts** : Ajout d'un `AbortController` sur les appels ORS API pour annuler les requêtes en cours
- **RouteList.tsx** : `useMemo` pour le tri des routes au lieu de `.slice().sort()` à chaque render
- **MapView.tsx** : Dépendances stables (extrait `points` et `geometry` comme variables séparées)
- **App.tsx** : GPX import simplifié — `await addRoute` avant `calculateRoute`, suppression des console.log de debug

### P2 — Optimisations moyennes
- **ElevationProfile.tsx** : Supprimé `data.map()` intermédiaire, accès direct aux données
- **routing.ts** : `[...route.points].sort()` au lieu de `route.points.sort()` — immutable
- **useMap.ts** : Suppression des 3 console.log de debug

## Decisions

- **Selecteurs Zustand individuels** : Chaque composant ne re-render que lorsque ses données changent spécifiquement
- **Batch INSERT/UPDATE** : Réduit drastiquement le nombre d'IPC calls vers le backend Tauri/Rust
- **AbortController** : Permet d'annuler les appels réseau obsolètes quand l'utilisateur change de route
- **Géométrie ORS dans le GPX** : On garde le comportement où le GPX exporte la géométrie ORS détaillée (~200+ points) plutôt que les waypoints originaux (2 points)

## Etat du projet

- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances
- En cours : Tests unitaires, Distribution de l'application

## Prochaines etapes
1. Tests unitaires
2. Distribution de l'application
3. Optimisation bundle (code splitting pour maplibre-gl)

## Fichiers modifies

- `src/components/ElevationProfile.tsx` — modifié (fix crash + optimisation canvas)
- `src/store/useRouteStore.ts` — modifié (batch INSERT/UPDATE, JOIN query, selecteurs)
- `src/services/routing.ts` — modifié (AbortController, sort immutable)
- `src/App.tsx` — modifié (selecteurs Zustand, AbortController, nettoyage)
- `src/components/MapView.tsx` — modifié (dépendances stables)
- `src/components/RouteList.tsx` — modifié (useMemo, sélecteur)
- `src/components/RouteEditor.tsx` — modifié (sélecteurs, useEffect stable)
- `src/hooks/useMap.ts` — modifié (suppression console.log)

## Assets (URLs)

- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
