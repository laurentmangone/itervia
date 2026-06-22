---
projet: Itervia
phase: Phase 1-2 MVP technique
derniere-session: 2026-06-22
tags: [projet/Itervia]
---

# Itervia — Contexte actif

## Etat courant
- Phase : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances + tests unitaires (39 tests) + build distribution (.app + .dmg) + code splitting maplibre-gl + distance/calcul D+ corrigés + waypoint management (drag, insert between, delete) + préférences utilisateur (clé API chiffrée AES-256-GCM) + appel ORS via Rust (reqwest)
- En cours : Rien

## Decisions cumulees
- CartoDB Positron pour tuiles (gratuit, sans clé)
- POST obligatoire pour API ORS directions (GET renvoie 405)
- Nominatim pour géocodage — gratuit, sans clé
- Zustand pour state management avec sélecteurs individuels
- Toujours utiliser `npm run tauri:dev` (--no-watch)
- Canvas natif pour profil altimétrique (pas de librairie chart)
- SQLite pour persistance locale (tauri-plugin-sql)
- Schema normalisé : routes + route_points avec foreign key
- Actions Zustand async : write SQLite first, then update state
- Batch INSERT/UPDATE pour les opérations sur les points
- LEFT JOIN pour charger les routes avec leurs points en 1 query
- AbortController sur les appels ORS API
- GPX exporte la géométrie ORS détaillée (pas les waypoints)
- Vitest pour les tests unitaires (compatible Vite)
- Bundle identifier : com.itervia.desktop
- Markers DOM (maplibregl.Marker) pour drag natif + bouton delete
- Clic sur la ligne d'itinéraire pour insertion (pas Alt+clic — crash webview)
- Snap des points insérés sur géométrie ORS existante
- Clé API ORS chiffrée AES-256-GCM côté Rust, stockée dans table SQLite preferences
- Appel ORS via Rust (reqwest) pour éviter CORS en dev

## Prochaines etapes
1. Phase 2 — Fonctionnalités avancées (à définir)

## Assets actifs (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
