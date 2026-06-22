# KIT-MEMOIRE — Mémoire de Session pour opencode

Résout l'amnésie inter-sessions d'opencode : quand tu fais `/clear`, le contexte n'est pas perdu.
Il est archivé localement et rechargeable en 30 secondes à la prochaine session.

**Gain concret** : la reprise de session consomme 2x moins de tokens qu'un re-briefing manuel.

---

## Le Problème

opencode n'a pas de mémoire entre les sessions.
Après un `/clear` ou une fermeture de terminal, tu dois tout ré-expliquer :
l'état du projet, les décisions prises, les prochaines étapes.

Ce kit installe une mémoire locale structurée qu'opencode sait lire et écrire automatiquement.

---

## Le Cycle de la Mémoire

```
En arrivant    →  /recall [projet]
                  opencode charge le contexte en 30 secondes.
                  Pas de re-briefing. Travail immédiat.

En travaillant →  opencode code, tu supervises.

En partant     →  /archive
                  opencode résume la session (décisions, état, prochaines étapes).

                  /clear
                  Session propre. Mémoire intacte.
```

---

## Installation

### Étape 1 — Copier le kit dans ton projet

Option A — projet vide : copier le **contenu** du dossier `KIT-MEMOIRE/` dans ta racine de projet.

Option B — projet existant : copier uniquement ces éléments dans ta racine de projet :
```
AGENTS.md
memory/
opencode.json
.opencode/
```

### Étape 2 — Installer Obsidian (optionnel mais recommandé)

Obsidian permet de visualiser les archives sous forme de graphe et de naviguer entre les sessions.

1. Télécharger Obsidian : https://obsidian.md
2. Ouvrir Obsidian
3. Cliquer "Ouvrir un vault"
4. Sélectionner le dossier `memory/` de ton projet

Le dossier `memory/` est déjà un vault Obsidian valide. Rien d'autre à configurer.

### Étape 3 — Ouvrir le projet dans opencode

```
opencode
```

Depuis la racine du projet. opencode charge automatiquement `opencode.json` et `AGENTS.md`.

### Étape 4 — Vérifier que la mémoire fonctionne

Taper dans opencode :
```
/recall
```

opencode doit répondre :
```
Aucune session trouvée pour ce projet.
Mémoire initialisée — memory/_index.md est prêt.
Décris ce sur quoi tu travailles et on commence.
```

La mémoire est opérationnelle.

---

## Structure du kit

```
AGENTS.md                    # Guide universel pour opencode
opencode.json                # Configuration opencode

.opencode/
└── skills/
    ├── recall/SKILL.md      # Logique complète de /recall
    └── archive/SKILL.md     # Logique complète de /archive

memory/                      # Vault Obsidian
├── _index.md                # Catalogue de toutes les sessions
├── archives/                # Une archive par session (immuable)
└── projets/                 # Un dossier par projet
    └── {nom}/
        ├── contexte.md      # Snapshot mutable — toujours à jour (voie rapide)
        └── historique.md    # Fil chronologique des sessions
```

---

## Commandes

| Commande | Quand | Ce qu'opencode fait |
|---|---|---|
| `/recall` | Début de session | Charge le contexte, affiche le briefing |
| `/recall {projet}` | Si plusieurs projets | Charge directement le projet nommé |
| `/archive` | Avant chaque `/clear` | Résume la session, écrit les fichiers |

---

## Pourquoi 2x moins de tokens ?

Chaque `/archive` crée deux fichiers :
- Une **archive** complète (~70 lignes) — immuable, trace historique
- Un **contexte.md** synthétisé (~25 lignes) — écrasé à chaque session

Au `/recall` suivant, opencode lit `contexte.md` en priorité.
Résultat : briefing en 25 lignes au lieu de parser 70 lignes d'archive.

---

## Multi-projets

Le système gère plusieurs projets dans le même dossier.
Chaque projet a son propre dossier dans `memory/projets/`.

```
/recall site-client-a
/recall app-mobile
```
