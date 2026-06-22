---
date: 2026-06-22
heure: "13:35"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 13h35 — Itervia Tests + Distribution

## Resume
Implémentation des tests unitaires (Vitest + Testing Library) et build de production de l'application native (Tauri .app + .dmg).

## Travail effectue
- Installation de Vitest, @testing-library/react, @testing-library/jest-dom, jsdom
- Création de la config Vitest (vitest.config.ts) avec environment jsdom
- Création des tests `src/services/routing.test.ts` : 19 tests (generateGPX, parseGPX, createElevationProfileFromGPX, calculateRoute)
- Création des tests `src/store/useRouteStore.test.ts` : 20 tests (CRUD routes/points avec mock SQLite)
- Ajout des scripts `test` et `test:watch` dans package.json
- Correction du bundle identifier dans tauri.conf.json (com.itervia.app → com.itervia.desktop)
- Build Tauri pour distribution : Itervia.app + Itervia_0.1.0_aarch64.dmg

## Decisions
- **Vitest comme framework de test** : naturellement compatible avec le setup Vite existant
- **Mock SQLite via vi.hoisted()** : nécessaire car vi.mock est hoisté et ne peut pas accéder aux variables externes
- **Exclusion des fichiers test du tsconfig.json** : évite les erreurs TypeScript (global, afterEach) dans les tests
- **Bundle identifier corrigé** : com.itervia.app → com.itervia.desktop pour éviter le conflit avec l'extension .app sur macOS

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances + tests unitaires (39 tests) + build distribution
- En cours : Optimisation bundle (code splitting pour maplibre-gl)

## Prochaines etapes
1. Optimisation bundle (code splitting pour maplibre-gl)
2. Distribution finale

## Fichiers modifies
- `package.json` — modifié (scripts test, devDependencies)
- `package-lock.json` — modifié
- `tsconfig.json` — modifié (exclude fichiers test)
- `src-tauri/tauri.conf.json` — modifié (bundle identifier)
- `vitest.config.ts` — créé
- `src/test-setup.ts` — créé
- `src/services/routing.test.ts` — créé (19 tests)
- `src/store/useRouteStore.test.ts` — créé (20 tests)

## Assets (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
