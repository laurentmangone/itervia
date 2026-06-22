---
date: 2026-06-22
heure: "08:30"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 08h30 — Itervia Export/Import GPX complet avec altitudes

## Resume
Test et validation de l'export/import GPX complet avec préservation des altitudes. Corrections critiques apportées pour garantir la fidélité des données d'élévation lors des allers-retours GPX.

## Travail effectue
- Fix critique : altitudes GPX originales préservées lors de l'import (plus de discard)
- Validation XML ajoutée : détection erreurs parse + vérification trackpoints
- Fix bug latitude 0 : condition `if (lat && lng)` → `if (!isNaN(lat) && !isNaN(lng))`
- XML escaping pour noms de routes dans export GPX (caractères spéciaux)
- Suppression `.geojson` de l'accept input (pas de parser GeoJSON)
- Nouvelle fonction `createElevationProfileFromGPX()` pour calculer distances cumulées
- Build TypeScript vérifié — pas d'erreur

## Decisions
- **Préserver altitudes GPX originales** : quand on importe un GPX, on utilise les altitudes du fichier原始 au lieu de re-fetcher via ORS
- **Validation XML obligatoire** : détecter les fichiers invalides avant traitement
- **XML escaping** : sécurité contre les caractères spéciaux dans les noms de routes
- **Pas de GeoJSON** : supprimer l'acceptation du fichier .geojson puisqu'il n'y a pas de parser

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Export/Import GPX complet avec altitudes, validation XML, gestion erreurs
- En cours : Sauvegarde locale parcours, optimisation performances

## Prochaines etapes
1. Sauvegarde locale parcours (localStorage ou SQLite)
2. Optimisation des performances
3. Tests unitaires pour les fonctions GPX

## Fichiers modifies
- `src/services/routing.ts` — ajout `escapeXml()`, `createElevationProfileFromGPX()`, fix `parseGPX()`
- `src/App.tsx` — import `createElevationProfileFromGPX`, fix `handleImportGPX()`
- `src/components/RouteList.tsx` — suppression `.geojson` de l'accept input

## Assets (URLs)
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`