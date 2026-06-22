---
name: recall
description: Use when the user types /recall to reload session context from memory/. Loads the project context, decisions, and next steps so work can resume without manual re-briefing. Optionally takes a project name as argument.
---

# Recall — Reprendre le contexte

Retrouve le contexte de travail depuis le dossier `memory/`.
Objectif : reprendre en 30 secondes après un `/clear` ou au début d'une nouvelle session.
Charge uniquement ce qui est nécessaire — pas tout le dossier.

## Action

### 1. Identifier le projet

- Si l'utilisateur a mentionné un nom de projet, l'utiliser directement.
- Sinon, lire `memory/_index.md` et afficher les projets disponibles.
- Si `memory/_index.md` est vide ou absent : répondre "Aucune session trouvée pour ce projet. Mémoire initialisée — memory/_index.md est prêt. Décris ce sur quoi tu travailles et on commence." et s'arrêter.

### 2. Charger l'historique

Lire `memory/projets/{nom}/historique.md` pour voir le fil chronologique.
Si le fichier n'existe pas : "Aucune session trouvée pour {projet}."

### 3. Charger le contexte (voie rapide)

**Si `memory/projets/{nom}/contexte.md` existe** : le lire en priorité.
C'est l'état courant synthétisé (~25 lignes). Voie rapide.

**Si `contexte.md` n'existe pas** : lire la dernière archive listée dans `historique.md`.
Extraire : état du projet, décisions, prochaines étapes, assets.

### 4. Présenter le briefing

```
## Reprise — {Projet}

**Dernière session** : {date} — {resume}
**Phase actuelle** : {phase}

### Etat
- Valide : ...
- En cours : ...

### Décisions clés
- ...

### Prochaines étapes
1. ...

### Assets disponibles
- {URLs ou "Aucun"}
```

### 5. Proposer la suite

"On reprend à l'étape {X} ?"
Si oui, lire les fichiers projet nécessaires et démarrer.
