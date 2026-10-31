# Spécification de l’existant

Ce dossier décrit le fonctionnement actuel de Harmonyz, son organisation technique et ses limites constatées lors de la rétro-ingénierie.

| Document                                                                  | Contenu                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [01 — Existant fonctionnel](01-existant-fonctionnel.md)                   | Parcours utilisateur, fonctions présentes et absentes.               |
| [02 — Architecture](02-architecture.md)                                   | Organisation du code, responsabilités et circulation des données.    |
| [03 — Analyse audio et rendu](03-analyse-audio-et-rendu.md)               | Algorithme actuel, signification du visuel, dimensions et export.    |
| [04 — Paramètres](04-parametres.md)                                       | Modèle d’état, valeurs par défaut, limites et presets.               |
| [05 — Limites actuelles](05-limites-actuelles.md)                         | Constats techniques et conséquences observables ou déduites du code. |
| [06 — Développement et vérification](06-developpement-et-verification.md) | Démarrage, contrôles, Docker, CI et recette manuelle.                |

## Périmètre et méthode

- Analyse réalisée le **31 octobre 2026**, à partir du commit `882e6188a57e60ac6cca575a505b2c44d9156fed`, version déclarée `0.0.8`.
- Sources : code de `app/`, configurations, manifeste et verrou npm, Dockerfile et workflows GitHub Actions. Les liens des documents renvoient aux fichiers concernés.
- Les comportements décrits comme existants sont constatés dans le code. Les vérifications exécutées sont consignées dans le [document 06](06-developpement-et-verification.md).
- Le parcours audio complet n’a pas été exécuté dans un navigateur pendant cet audit. Les points qui nécessitent une validation à l’exécution sont signalés.
- Les propositions d’évolution sont regroupées dans le dossier [feature](../feature/README.md).

Les documents ont ensuite été mis à jour avec le développement de la [feature 003 — mode animé musical](../feature/003-mode-anime-musical/README.md) et de la [feature 002](../feature/002-style-joy-division/README.md) le 31 octobre 2026. Les vérifications du mode animé sont consignées dans sa [recette](../feature/003-mode-anime-musical/validation/README.md). Les résultats de l’audit initial restent datés ; les vérifications du nouveau style sont consignées dans sa [recette](../feature/002-style-joy-division/validation/README.md).

[Retour à la documentation](../README.md).
