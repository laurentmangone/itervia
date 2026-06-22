---
date: 2026-06-22
heure: "09:21"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 09h21 — Itervia Profil altimétrique

## Resume
Implémentation du profil altimétrique pour Itervia. Les données d'altitude sont extraites de la réponse ORS (3ème coordonnée) et affichées dans le composant Canvas existant. L'export/import GPX inclut maintenant les altitudes.

## Travail effectue
- Ajout de `haversineDistance()` pour calculer les distances cumulées en mètres
- Extraction des altitudes depuis la réponse ORS (`coordinates[i][2]`)
- Calcul de `elevationGain` (D+) à partir des différences positives d'altitude
- Construction du tableau `ElevationPoint[]` (distance cumulée + altitude)
- Modification de `parseGPX()` pour extraire les balises `<ele>` des trkpt
- Modification de `generateGPX()` pour inclure les balises `<ele>` dans l'export
- Stockage de `elevationProfile` et `elevationGain` dans le store Zustand via `App.tsx`
- Test validé : le profil altimétrique s'affiche sous la carte après calcul ORS

## Decisions
- **Haversine pour les distances** : calcul précis des distances GPS sans dépendance externe
- **Extraction altitude depuis ORS** : ORS renvoie déjà les altitudes quand `elevation: true` — pas besoin d'appel supplémentaire
- **Canvas natif pour le graphique** : pas de librairie chart, tout est dessiné manuellement dans `ElevationProfile.tsx`

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Scaffold Tauri v2, carte MapLibre GL, sidebar, store Zustand, recherche lieu, GPX, calcul itinéraire ORS, profil altimétrique
- En cours : Sauvegarde locale parcours

## Prochaines etapes
1. Tester export/import GPX complet avec altitudes
2. Sauvegarde locale parcours (localStorage ou SQLite)
3. Optimisation des performances (throttle map events, lazy loading)

## Fichiers modifies
- `src/services/routing.ts` — modifié (haversineDistance, extraction altitude ORS, GPX import/export)
- `src/App.tsx` — modifié (stockage elevationProfile/elevationGain)

## Assets (URLs)
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
