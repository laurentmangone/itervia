---
date: 2026-06-22
heure: "09:00"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 09h00 — Itervia Sauvegarde locale SQLite

## Resume
Implémentation de la persistance locale avec SQLite pour sauvegarder les parcours. Migration du store Zustand vers des actions async avec écriture SQLite en priorité.

## Travail effectue
- Intégration tauri-plugin-sql avec SQLite
- Schema normalisé : tables routes + route_points avec foreign key
- Geometry et elevation_profile stockés en JSON TEXT
- Migration 3 tables : routes, route_points, indexes
- Store Zustand refactorisé avec actions async (write SQLite first, then update state)
- Service database.ts avec singleton pour connexion
- App.tsx : chargement routes au démarrage via loadRoutes()
- Permissions SQL ajoutées aux capabilities
- Build TypeScript vérifié — pas d'erreur

## Decisions
- **SQLite pour persistance** : solution native Tauri, pas de serveur, pas de dépendance réseau
- **Schema normalisé** : routes + route_points séparés pour opérations CRUD sur les points
- **JSON TEXT pour geometry** : simpler et portable, suffisant pour l'échelle d'Itervia
- **Actions async Zustand** : write SQLite first, then update state pour intégrité données
- **Singleton database** : une seule connexion réutilisée, pas de reconnexion

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes les fonctionnalités MVP + persistance SQLite
- En cours : Optimisation des performances

## Prochaines etapes
1. Optimisation des performances
2. Tests unitaires
3. Distribution de l'application

## Fichiers modifies
- `src-tauri/Cargo.toml` — ajout tauri-plugin-sql
- `package.json` — ajout @tauri-apps/plugin-sql
- `src-tauri/src/lib.rs` — configuration plugin avec migrations
- `src-tauri/capabilities/default.json` — ajout permissions SQL
- `src/services/database.ts` — nouveau service connexion SQLite
- `src/store/useRouteStore.ts` — refactorisation complète avec SQLite
- `src/App.tsx` — ajout chargement routes au démarrage

## Assets (URLs)
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`