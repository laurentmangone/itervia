---
date: 2026-06-21
heure: "22:50"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-21 22h50 — Itervia MVP technique

## Resume
Création du scaffold complet d'une app desktop Tauri v2 + React + TypeScript pour planification d'itinéraires vélo/rando. Intégration MapLibre GL JS, API OpenRoutesService (POST), géocodage Nominatim, export/import GPX. L'app se lance mais le calcul d'itinéraire ne s'affiche pas encore dans l'UI.

## Travail effectue
- Scaffold Tauri v2 avec React + TypeScript + Vite
- Installation Rust + Tauri CLI
- Intégration MapLibre GL JS avec tuiles CartoDB Positron (gratuites)
- Store Zustand pour gestion des routes et points
- Service API OpenRoutesService (POST, geojson)
- Géocodage via Nominatim/OpenStreetMap (barre de recherche)
- Composants: MapView, RouteList, RouteEditor, ElevationProfile (Canvas)
- Export GPX / Import GPX (DOMParser)
- CSS complet responsive avec sidebar
- Configuration Tauri: capabilities, CSP, bundle identifier

## Decisions
- **CartoDB Positron** au lieu de MapTiler : la clé demo MapTiler était limitée, CartoDB est gratuit sans clé
- **POST au lieu de GET** pour l'API ORS : l'endpoint directions nécessite POST (erreur 405 avec GET)
- **Nominatim** pour géocodage : gratuit, sans clé API, fiable
- **Zustand** pour state management : léger, simple, pas de boilerplate
- **Bundle identifier com.itervia.app** : requis par Tauri pour la build

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Scaffold Tauri, carte interactive, sidebar, recherche lieu, store, GPX
- En cours : Calcul d'itinéraire ne s'affiche pas dans l'UI (API fonctionne en curl)

## Prochaines etapes
1. Diagnostiquer pourquoi le tracé ne s'affiche pas après calcul (vérifier console)
2. Ajouter le profil altimétrique (Plotly ou Canvas)
3. Tester export/import GPX complet
4. Sauvegarde locale des parcours (localStorage ou SQLite)

## Fichiers modifies
- `src/App.tsx` —créé, layout principal + handleCalculateRoute
- `src/App.css` —créé, styles complets
- `src/main.tsx` —créé, entry React
- `src/components/MapView.tsx` —créé, carte + recherche
- `src/components/RouteList.tsx` —créé, sidebar parcours
- `src/components/RouteEditor.tsx` —créé, éditeur points
- `src/components/ElevationProfile.tsx` —créé, profil Canvas
- `src/hooks/useMap.ts` —créé, hook MapLibre + moveTo + geocode
- `src/services/routing.ts` —créé, API ORS POST + GPX
- `src/store/useRouteStore.ts` —créé, Zustand store complet
- `src/types/index.ts` —créé, types TypeScript
- `src/vite-env.d.ts` —créé, types ImportMeta
- `package.json` —créé, dépendances
- `tsconfig.json` —créé
- `tsconfig.node.json` —créé
- `vite.config.ts` —créé
- `index.html` —créé
- `src-tauri/tauri.conf.json` —modifié, CSP + identifier
- `src-tauri/capabilities/default.json` —créé
- `.env` —créé, clé ORS

## Assets (URLs)
- CartoDB tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Nominatim: `https://nominatim.openstreetmap.org/search?format=json&q=...`
- ORS API: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`