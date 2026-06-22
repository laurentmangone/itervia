---
date: 2026-06-22
heure: "16:30"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 16h30 — Itervia Waypoint Management

## Resume
Implémentation complète de la gestion des waypoints sur la carte : drag & drop, insertion entre deux points existants, et suppression via bouton au survol. Les points insérés sont snappés sur la géométrie existante pour ne pas dévier l'itinéraire.

## Travail effectue
- Migration des markers GeoJSON vers des markers DOM (`maplibregl.Marker`) avec support drag natif
- Ajout bouton de suppression (×) visible au survol de chaque marker
- Insertion de points entre deux existants via clic sur la ligne d'itinéraire
- Snap des points insérés sur la géométrie ORS existante (`snapToGeometry`)
- Debounce du handler clic pour éviter les doubles ajouts au double-clic
- CSS pour les markers avec numéro, bouton delete, et curseurs dynamiques

## Decisions
- **Markers DOM au lieu de couches GeoJSON** : les couches circle ne supportent pas le drag natif ni les boutons DOM — les markers DOM résolvent les deux
- **Clic sur la ligne au lieu de Alt+clic** : les touches Alt/Command crashent le webview Tauri — détection du clic sur la couche route-line-layer suffit
- **Snap sur géométrie existante** : un point cliqué sur la ligne mais légèrement hors-route faisait dévier l'itinéraire au recalcul — snap aux coordonnées les plus proches de la géométrie ORS
- **Suppression par bouton au survol plutôt que double-clic** : le double-clic est intercepté par le zoom MapLibre — un bouton × au survol est plus fiable

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances + tests unitaires (39 tests) + build distribution (.app + .dmg) + code splitting maplibre-gl + distance/calcul D+ corrigés + waypoint management (drag, insert, delete)
- En cours : Rien

## Prochaines etapes
1. Phase 2 — Fonctionnalités avancées (à définir)

## Fichiers modifies
- `src/App.tsx` — modifié : ajout handlePointDrag, handlePointDelete, debounce clic, snap insertion
- `src/App.css` — modifié : CSS markers (.route-point-marker, .route-point-number, .route-point-delete)
- `src/components/MapView.tsx` — modifié : wiring callbacks drag/delete/insert, nouveau prototype onMapClick
- `src/hooks/useMap.ts` — modifié : réécriture complète markers DOM, addPointMarkers, enableRouteLineInsert retiré, setCursorStyle
- `src/services/routing.ts` — modifié : ajout snapToGeometry()
- `src/store/useRouteStore.ts` — modifié : ajout insertPointBetween()

## Assets (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
