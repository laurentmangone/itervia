---
date: 2026-06-22
heure: "15:00"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 15h00 — Itervia Optimisation bundle + Fix distance/D+

## Resume
Optimisation du bundle avec code splitting maplibre-gl, correction du calcul de distance (utilisation haversine au lieu de segments ORS), et fix du D+ altimétrique avec seuil adaptatif de 5m pour filtrer le bruit SRTM.

## Travail effectue
- Code splitting maplibre-gl : `manualChunks` Vite + lazy loading MapView avec React.lazy/Suspense
- Bundle initial réduit de ~270 KB à 54 KB gzip
- Fix distance : `cumulativeDistance` (haversine) remplace `segments[0].distance` ORS (qui ne retournait que le 1er segment)
- Fix D+ : seuil adaptatif 5m pour filtrer bruit altimétrique SRTM (48m vs 50m OpenRunner)
- Mise à jour des tests unitaires (39/39)

## Decisions
- **Code splitting maplibre-gl** : isoler la librairie lourde (~800KB) dans un chunk séparé pour accélérer le chargement initial
- **Distance haversine** : `segments[0].distance` ORS retournait une valeur erronée (200m pour un parcours de 5km) — la distance cumulée depuis la géométrie est plus fiable
- **Seuil D+ 5m** : les données SRTM d'ORS sont bruitées — un seuil de 5m filtre les micro-variations tout en préservant les vrais dénivelés (écart de 4% vs OpenRunner, acceptable)

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances + tests unitaires (39 tests) + build distribution (.app + .dmg) + code splitting maplibre-gl + distance/calcul D+ corrigés
- En cours : Rien

## Prochaines etapes
1. Phase 2 — Fonctionnalités avancées (à définir)

## Fichiers modifies
- `vite.config.ts` — modifié (ajout manualChunks pour maplibre-gl)
- `src/App.tsx` — modifié (lazy loading MapView, seuil D+ import GPX)
- `src/services/routing.ts` — modifié (distance haversine, seuil D+ 5m)
- `src/services/routing.test.ts` — modifié (adaptation aux nouvelles valeurs)

## Assets (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
