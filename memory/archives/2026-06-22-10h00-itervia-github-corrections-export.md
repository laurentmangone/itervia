---
date: 2026-06-22
heure: "10:00"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 10h00 — Itervia GitHub + Corrections exports

## Resume
Création du repository GitHub, correction du bug d'ajout de points sur la carte, amélioration de l'export GPX avec dialogue de sauvegarde natif.

## Travail effectue
- Créé le repository GitHub `laurentmangone/itervia` et poussé le code
- Corrigé le bug où un seul point pouvait être placé sur la carte (handleMapClick n'appelait pas addRoute pour les nouvelles routes)
- Corrigé l'export GPX pour fonctionner sans géométrie ORS (utilise les points directement)
- Ajouté `tauri-plugin-dialog` et `tauri-plugin-fs` pour le dialogue "Enregistrer sous" natif
- Configuré les capabilities Tauri pour dialog et fs
- Modifié le bouton Export pour être actif dès qu'il y a des points

## Decisions
- **addRoute avant setCurrentRoute** : la route doit être sauvegardée dans le store SQLite avant d'être définie comme currentRoute, sinon les clics suivants ne fonctionnent pas
- **Export sans ORS** : permettre l'export même sans géométrie calculée, en utilisant les points cliqués directement
- **Dialogue natif Tauri** : utiliser `tauri-plugin-dialog` plutôt que le téléchargement browser pour une meilleure UX desktop

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export avec dialogue natif
- En cours : Optimisation des performances

## Prochaines etapes
1. Optimisation des performances
2. Tests unitaires
3. Distribution de l'application

## Fichiers modifies
- `src/App.tsx` — corrigé handleMapClick (addRoute), handleExportGPX (dialog natif), bouton export
- `src/services/routing.ts` — corrigé generateGPX pour points sans geometry
- `src-tauri/Cargo.toml` — ajouté tauri-plugin-dialog et tauri-plugin-fs
- `src-tauri/src/lib.rs` — enregistré dialog et fs plugins
- `src-tauri/capabilities/default.json` — ajouté permissions dialog et fs
- `package.json` — ajouté @tauri-apps/plugin-dialog et @tauri-apps/plugin-fs
- `.gitignore` — créé pour exclure node_modules, dist, target, memory

## Assets (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
