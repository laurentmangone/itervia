---
date: 2026-06-22
heure: "21:00"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 21h00 — Itervia Test calcul ORS

## Resume
Session de vérification et test du calcul d'itinéraire ORS. L'app se lance correctement et le tracé s'affiche sur la carte. Documenté comment lancer l'app sans crash.

## Travail effectue
- Vérifié la structure du codebase et les flux de données (routing.ts, useMap.ts, MapView.tsx, App.tsx)
- Lancé l'app avec `npm run tauri:dev` (--no-watch) — le watcher standard crash l'app
- Testé le calcul d'itinéraire ORS : le tracé s'affiche correctement sur la carte
- Vérifié que le build TypeScript passe sans erreur
- Confirmé que la clé API ORS est présente dans `.env`

## Decisions
- **Utiliser `nohup npm run tauri:dev`** pour garder le process en vie dans le terminal — sinon le process meurt quand le shell se ferme
- **Le build passe** : pas de modification nécessaire, le code de la session 3 fonctionne

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Scaffold Tauri v2, carte MapLibre GL, sidebar, store Zustand, recherche lieu, GPX, calcul itinéraire ORS fonctionnel
- En cours : Profil altimétrique, export/import GPX complet, sauvegarde locale

## Prochaines etapes
1. Ajouter profil altimétrique
2. Tester export/import GPX complet
3. Sauvegarde locale parcours (localStorage ou SQLite)

## Fichiers modifies
- Aucun fichier modifié — session de test uniquement

## Assets (URLs)
Aucun nouvel asset. Assets existants :
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
