---
name: archive
description: Use when the user types /archive to save the current session context. Summarizes decisions, project state, modified files and asset URLs into memory/ so the session can be resumed later via /recall.
---

# Archive — Sauvegarder la session

Archive la session en cours dans le dossier `memory/`.
Objectif : permettre à l'utilisateur de faire `/clear` sans perdre le contexte.
L'archive doit contenir tout ce qu'il faut pour reprendre dans une session future.

## Action

### 1. Collecter le contexte

Synthétiser depuis la conversation en cours :
- **Projet** concerné (demander si ambigu)
- **Travail effectué** : livrables, fichiers créés/modifiés
- **Décisions** prises et pourquoi
- **État du projet** : phase, valide, en cours
- **Prochaines étapes** prévues
- **Fichiers modifiés** avec chemins complets
- **Assets générés** : URLs (noter "Aucun." si session logique)

### 2. Générer le fichier archive

Chemin : `memory/archives/YYYY-MM-DD-HHhMM-{projet}-{resume-court}.md`

Format :

```markdown
---
date: YYYY-MM-DD
heure: "HH:MM"
projet: {nom}
phase: {phase actuelle}
tags: [projet/{nom}, type/archive]
---

# Session YYYY-MM-DD HHhMM — {Projet} {Resume}

## Resume
[2-3 phrases : objectif + résultat livré]

## Travail effectue
- {action 1}
- {action 2}

## Decisions
- **{Decision}** : {raison}

## Etat du projet
- Phase actuelle : {phase}
- Valide : {éléments terminés}
- En cours : {éléments en cours}

## Prochaines etapes
1. {étape 1}
2. {étape 2}

## Fichiers modifies
- `{chemin}` — {créé|modifié|supprimé}

## Assets (URLs)
{URLs ou "Aucun."}
```

### 3. Écraser contexte.md

Écrire `memory/projets/{nom}/contexte.md` avec l'état courant synthétisé (~25 lignes).
Remplacer entièrement si existant. Ne pas accumuler.

```markdown
---
projet: {nom}
phase: {phase actuelle}
derniere-session: YYYY-MM-DD
tags: [projet/{nom}]
---

# {Projet} — Contexte actif

## Etat courant
- Phase : {phase actuelle}
- Valide : {éléments terminés}
- En cours : {éléments en cours}

## Decisions cumulees
- {décision 1} — {raison}

## Prochaines etapes
1. {étape 1}
2. {étape 2}

## Assets actifs (URLs)
{URLs les plus récentes uniquement}
```

### 4. Mettre à jour l'historique

Ajouter dans `memory/projets/{nom}/historique.md` :
```
- [YYYY-MM-DD HHhMM — {resume}](../../archives/YYYY-MM-DD-HHhMM-{projet}-{resume}.md)
```

Si le fichier n'existe pas, le créer :
```markdown
---
projet: {nom}
tags: [projet/{nom}]
---

# {Projet} — Historique des sessions

- [YYYY-MM-DD HHhMM — {resume}](../../archives/YYYY-MM-DD-HHhMM-{projet}-{resume}.md)
```

### 5. Mettre à jour l'index

Dans `memory/_index.md`, ajouter dans la section "Archives".
Si première archive (section vide ou placeholder) : remplacer le placeholder.

```
- [YYYY-MM-DD HHhMM — {Projet} {resume}](archives/YYYY-MM-DD-HHhMM-{projet}-{resume}.md)
```

S'assurer que le projet figure dans la section "Projets" :
```
- [{Projet}](projets/{nom}/historique.md)
```

### 6. Confirmer

```
Archive créée : memory/archives/YYYY-MM-DD-HHhMM-{projet}-{resume}.md
Contexte mis à jour : memory/projets/{nom}/contexte.md
Assets sauvegardés : {N}

Le /clear est safe — utiliser /recall {projet} pour reprendre.
```
