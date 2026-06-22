---
date: 2026-06-22
heure: "18h55"
projet: Itervia
phase: Phase 1-2 MVP technique
tags: [projet/Itervia, type/archive]
---

# Session 2026-06-22 18h55 — Itervia Préférences utilisateur + Chiffrement API key

## Resume
Ajout d'un système de préférences utilisateur pour stocker la clé API OpenRouteService de manière sécurisée. La clé est chiffrée (AES-256-GCM) côté Rust avant d'être stockée dans SQLite. L'appel API ORS est aussi déplacé côté Rust pour résoudre les erreurs CORS en dev.

## Travail effectue
- Créé `src/store/usePreferencesStore.ts` — Store Zustand pour préférences, persistance SQLite
- Créé `src/components/SettingsDialog.tsx` — Dialog de settings avec champ clé API + lien openroutes.org
- Créé `src-tauri/src/crypto.rs` — Module chiffrement AES-256-GCM (clé dérivée hostname + salt)
- Ajouté Tauri commands `encrypt_value` / `decrypt_value` dans `lib.rs`
- Ajouté migration v4 SQLite : table `preferences`
- Ajouté `calculate_ors_route` — Tauri command Rust pour appeler l'API ORS (évite CORS)
- Modifié `src/services/routing.ts` — Utilise `invoke('calculate_ors_route')` au lieu de `fetch`
- Modifié `src/App.tsx` — Bouton ⚙ settings, chargement préférences au démarrage
- Modifié `src/App.css` — Styles dialog settings
- Corrigé erreurs TS pré-existantes dans `useMap.ts` (unused variables, type callback)
- Mis à jour tests : mock `invoke` au lieu de `fetch`

## Decisions
- **Chiffrement AES-256-GCM côté Rust** : La clé API ne doit pas être stockée en clair dans SQLite. Chiffrement avec clé dérivée du hostname machine + salt.
- **Appel ORS via Rust (reqwest)** : CORS bloquait les appels depuis `localhost:1420` en dev. Déplacement côté Rust résout le problème.
- **Fallback sans chiffrement** : Si le chiffrement échoue, la clé est stockée en clair plutôt que de bloquer l'utilisateur.
- **Clé de chiffrement persistée** dans `~/.local/share/itervia/.secret_key` — dérivée de SHA256(hostname + salt).

## Etat du projet
- Phase actuelle : Phase 1-2 MVP technique
- Valide : Toutes fonctionnalités MVP + persistance SQLite + GPX complet + export dialogue natif + optimisations performances + tests unitaires (39 tests) + build distribution (.app + .dmg) + code splitting maplibre-gl + distance/calcul D+ corrigés + waypoint management (drag, insert between, delete) + préférences utilisateur (clé API chiffrée) + appel ORS via Rust
- En cours : Rien

## Prochaines etapes
1. Phase 2 — Fonctionnalités avancées (à définir)

## Fichiers modifies
- `src-tauri/Cargo.toml` — ajoute aes-gcm, rand, sha2, base64, dirs, hostname, reqwest
- `src-tauri/Cargo.lock` — mis à jour
- `src-tauri/src/crypto.rs` — créé (chiffrement AES-256-GCM)
- `src-tauri/src/lib.rs` — ajoute commands encrypt/decrypt/calculate_ors_route + migration v4
- `src/store/usePreferencesStore.ts` — créé (store préférences + chiffr. SQLite)
- `src/components/SettingsDialog.tsx` — créé (dialog settings)
- `src/services/routing.ts` — modifié (invoke ORS au lieu de fetch)
- `src/services/routing.test.ts` — modifié (mock invoke)
- `src/App.tsx` — modifié (bouton ⚙, loadPreferences)
- `src/App.css` — modifié (styles settings)
- `src/hooks/useMap.ts` — corrigé (unused vars, type callback)

## Assets (URLs)
- Repository: https://github.com/laurentmangone/itervia
- Tiles: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- Géocodage: `https://nominatim.openstreetmap.org/search`
- Routing: `https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`
