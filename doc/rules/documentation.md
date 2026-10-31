# Règles de lecture et de création des documents

Ces règles s’appliquent à la lecture, à la création et à la mise à jour de la documentation Harmonyz, ainsi qu’aux changements de code qui affectent les comportements documentés.

## Lire avant d’intervenir

1. Partir de l’[index général](../README.md).
2. Pour comprendre ou modifier l’existant, lire l’[index des spécifications](../specification/README.md), puis les documents relatifs au périmètre concerné.
3. Pour travailler sur une fonctionnalité souhaitée, lire l’[index des features](../feature/README.md), le `README.md` de son dossier numéroté et les documents complémentaires utiles à la tâche. Consulter aussi les spécifications du comportement actuel concerné.
4. Vérifier les affirmations sur l’existant dans les fichiers sources correspondants. En cas d’écart, préciser le comportement constaté et corriger la documentation concernée ; une proposition dans une feature décrit une cible à réaliser.

La lecture est terminée lorsque le comportement actuel, le résultat attendu et les décisions encore ouvertes utiles à la tâche sont identifiés. Lire les documents liés selon ce périmètre.

## Choisir l’emplacement

| Nature du contenu                                                                                 | Emplacement                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Comportement implémenté, architecture, paramètres, limites constatées et fonctionnement du projet | `doc/specification/`                 |
| Objectif, évolution souhaitée, parcours cible et critères d’acceptation d’une fonctionnalité      | `doc/feature/NNN-nom-de-la-feature/` |
| Convention transversale de lecture, de création ou de maintenance des documents                   | `doc/rules/`                         |

Si un document mélange état actuel et évolution souhaitée, répartir les contenus entre spécification et feature, puis relier les deux. Conserver chaque règle dans un seul document de référence ; les autres documents y renvoient.

## Spécifications de l’existant

- Compléter le document pertinent avant d’en créer un nouveau. Pour un nouveau sujet, suivre la numérotation et le nommage de l’index des spécifications.
- Décrire ce que le code fait actuellement, avec des liens relatifs vers les sources concernées.
- Distinguer les faits vérifiés, les déductions de lecture du code et les comportements restant à vérifier à l’exécution.
- Situer les audits et mesures dans le temps, avec leur version ou commit de référence lorsque cela aide à les interpréter. Conserver la date et le périmètre des résultats historiques.

## Fonctionnalités et références stables

- Créer un dossier par fonctionnalité au format `NNN-nom-de-la-feature`, avec un numéro sur trois chiffres et un nom descriptif en minuscules séparées par des tirets.
- Attribuer le numéro suivant le plus élevé déjà réservé dans l’index ou les dossiers de features : après `001`, utiliser `002`, puis `003`.
- Conserver le numéro attribué pendant toute la vie de la fonctionnalité, y compris lorsque son nom ou sa priorité change. Un numéro reste réservé après abandon ; conserver alors son entrée dans l’index avec ce statut.
- Référencer une fonctionnalité par son numéro stable et un lien vers son `README.md`.
- Regrouper ses documents complémentaires et ressources dans son dossier. Créer ces fichiers lorsqu’un contenu réel le justifie.

Structure minimale :

```text
doc/feature/
├── README.md
└── 001-creation-de-poster/
    └── README.md
```

Le `README.md` d’une feature précise l’objectif et son statut, le périmètre et le comportement attendu, les critères d’acceptation et les décisions encore ouvertes. Relier les spécifications concernées et les dépendances à d’autres features lorsqu’elles existent. Distinguer les choix validés des propositions et des points à préciser.

## Mettre à jour avec les changements

- Lorsqu’un changement de code modifie un comportement, une architecture ou un paramètre documenté, mettre à jour la spécification concernée dans la même intervention.
- Pour une feature réalisée, mettre à jour son statut et consigner les vérifications effectuées ainsi que les limites restantes. La spécification décrit alors le comportement effectivement livré.
- Lors d’une création, d’un déplacement ou d’un renommage, actualiser l’index du groupe et tous les liens concernés. Ajouter un nouveau groupe dans l’index général.
- Rédiger les explications en français et conserver les identifiants du code et des chemins tels qu’ils existent. Utiliser des liens relatifs entre documents et vers les sources.

## Vérifier avant de terminer

- Chaque document nouveau est accessible depuis l’index général ou celui de son groupe ; les nouveaux groupes sont accessibles depuis l’index général.
- Chaque lien local pointe vers une cible existante et chaque numéro de feature est unique.
- Les modifications respectent les conventions ci-dessus et le formatage Prettier du projet. Exécuter la vérification de formatage sur les fichiers modifiés.
- Rapporter les contrôles réellement exécutés. Les changements limités à la documentation demandent une vérification des liens, de la structure et du formatage ; les changements de code demandent aussi les contrôles adaptés à leur portée.
