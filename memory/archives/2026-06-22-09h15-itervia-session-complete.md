---
date: 2026-06-22
heure: "09:15"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 09h15 — Itervia Session complète

## Resume
Session complète couvrant le test d'export/import GPX avec altitudes et l'implémentation de la sauvegarde locale SQLite. Toutes les fonctionnalités MVP technique sont maintenant validées et persistées.

## Travail effectue
- Fix export/import GPX complet avec préservation des altitudes
- Validation XML et gestion erreurs pour import GPX
- Fix bug latitude 0 dans parseGPX
- XML escaping pour noms de routes dans export GPX
- Suppression .geojson de l'accept input
- Nouvelle fonction createElevationProfileFromGPX()
- Intégration tauri-plugin-sql avec SQLite
- Schema normalisé routes + route_points avec foreign key
- Refactorisation store Zustand avec actions async
- Service database.ts avec singleton
- Chargement routes au démarrage dans App.tsx
- Permissions SQL ajoutées aux capabilities

## Decisions
- **Préservation altitudes GPX** : utiliser les altitudes originales du fichier lors de l'import
- **Validation XML** : détecter les fichiers invalides avant traitement
- **XML escaping** : sécurité contre les caractères spéciaux dans les noms
- **SQLite pour persistance** : solution native Tauri, pas de serveur
- **Schema normalisé** : routes + route_points séparés pour opérations CRUD
- **JSON TEXT pour geometry** : simpler et portable pour l'échelle d'Itervia
- **Actions async Zustand** : write SQLite first, then update state

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet
- En cours : Optimisation des performances

## Prochaines etapes
1. Optimisation des performances
2. Tests unitaires
3. Distribution de l'application

## Fichiers modifies
- `src/services/routing.ts` — ajout escapeXml(), createElevationProfileFromGPX(), fix parseGPX()
- `src/App.tsx` — import createElevationProfileFromGPX, fix handleImportGPX(), ajout loadRoutes()
- `src/components/RouteList.tsx` — suppression .geojson de l'accept input
- `src-tauri/Cargo.toml` — ajout tauri-plugin-sql
- `package.json` — ajout @tauri-apps/plugin-sql
- `src-tauri/src/lib.rs` — configuration plugin avec migrations
- `src-tauri/capabilities/default.json` — ajout permissions SQL
- `src/services/database.ts` — nouveau service connexion SQLite
- `src/store/useRouteStore.ts` — refactorisation complète avec SQLite

## Assets (URLs)
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`