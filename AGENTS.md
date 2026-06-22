# Mémoire de Session — Guide

## Problème

opencode n'a pas de mémoire entre les sessions. Après un `/clear` ou une fermeture de terminal, tout le contexte est perdu.

Ce système résout l'amnésie : les sessions sont archivées localement dans `memory/` et rechargeables en 30 secondes.

## Ton rôle

- Début de session → l'utilisateur tape `/recall` (ou charge le contexte manuellement)
- Travail → tu exécutes, l'utilisateur supervise
- Fin de session → l'utilisateur tape `/archive`, puis `/clear` — la mémoire est sauvegardée

## Structure de la mémoire

```
memory/
├── _index.md                  # Catalogue de toutes les sessions
├── archives/                  # Une archive par session (immuable)
│   └── YYYY-MM-DD-HHhMM-{projet}-{resume}.md
└── projets/                   # Un dossier par projet
    └── {nom}/
        ├── contexte.md        # Snapshot mutable — toujours à jour (~25 lignes, voie rapide)
        └── historique.md      # Fil chronologique des sessions
```

### Pourquoi contexte.md est important

- Il est lu EN PRIORITÉ par `/recall` (voie rapide, ~25 lignes)
- Il est ÉCRASÉ à chaque `/archive` (pas d'accumulation)
- Résultat : reprise de session 2x moins de tokens

## Cycle de session

```
Nouvelle session
  └─ /recall [projet]     → briefing en 30 secondes, pas de re-briefing

Travail
  └─ tu exécutes, l'utilisateur supervise

Fin de session
  └─ /archive             → contexte sauvegardé
  └─ /clear               → session propre, mémoire intacte
```

## Première session

Si `memory/_index.md` est vide ou absent :
```
Aucune session trouvée pour ce projet.
Mémoire initialisée — memory/_index.md est prêt.
Décris ce sur quoi tu travailles et on commence.
```
