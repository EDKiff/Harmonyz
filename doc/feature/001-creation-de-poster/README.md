# 001 — Créer un poster représentant une musique

## Objectif et statut

**Objectif exprimé : créer un site ou une application permettant de produire un poster représentant une musique.**

Le parcours cible, les priorités et les critères ci-dessous sont des propositions de reprise. Les choix encore ouverts restent à préciser ; les comportements déjà implémentés sont décrits dans la [spécification de l’existant](../../specification/README.md).

## Première version cible proposée

Le besoin exprimé permet de retenir un parcours court : **importer une musique → obtenir une représentation couvrant le morceau → choisir un style et un format → télécharger un poster exploitable**.

Pour ce premier périmètre, le traitement dans le navigateur est déjà une base réutilisable. Un compte, une base de données, un catalogue musical, du paiement ou une application native ne sont pas nécessaires au parcours décrit et ne sont pas proposés comme prérequis.

La couverture du morceau entier est une proposition cohérente avec l’objectif, pas un comportement actuellement acquis. Si l’intention est plutôt de représenter un extrait, son choix et sa durée devront devenir explicites dans l’interface.

## Ordre de reprise suggéré

1. **Fiabiliser la matière musicale.** Corriger les Hz, définir la couverture temporelle, traiter les canaux, fichiers courts et silence. Vérifier la position d’un signal étalon et la présence du début comme de la fin du morceau.
2. **Rendre l’édition réactive.** Séparer données audio, paramètres de rendu et dimensions ; réutiliser l’analyse ; fermer les contextes et gérer les demandes devenues obsolètes. Vérifier qu’une couleur ou un format ne déclenche plus de décodage.
3. **Fiabiliser le résultat téléchargeable.** Harmoniser pixels/mm/DPI, plafonner les dimensions, appliquer réellement les couleurs et produire une image cohérente avec l’aperçu. Vérifier dimensions et ouverture du PNG exporté.
4. **Simplifier l’usage.** Proposer les presets d’abord, rendre les erreurs compréhensibles, travailler le petit écran et l’accès clavier. Ajouter titre/artiste seulement si cette personnalisation est retenue.

## Critères d’acceptation proposés

- Un MP3 valide produit un poster sans exposer les réglages FFT à l’utilisateur qui suit le parcours simple.
- Le poster couvre la portion de musique annoncée, avec des repères fréquentiels corrects.
- Changer les couleurs ou le format réutilise l’analyse déjà disponible et conserve un aperçu utilisable.
- Un fichier illisible, trop volumineux, silencieux ou trop court reçoit un traitement explicite.
- Un export réussi correspond au dernier état affiché, respecte les dimensions en pixels annoncées et évite les allocations excessives.
- Le parcours est utilisable sur les écrans et navigateurs retenus, au clavier comme au pointeur.

## Décisions produit encore ouvertes

Le moteur spectral existant peut être conservé comme premier style. Le dépôt ne permet pas de déduire si d’autres représentations sont souhaitées, si les axes doivent être visibles, si un texte doit figurer sur le poster ou si l’objectif prioritaire est l’impression physique plutôt que le partage numérique. Ces choix orienteront la suite ; ils n’empêchent pas les corrections du socle actuel.

## Évolutions proposées à partir de l’existant

Les références L01 à L13 renvoient aux [limites actuelles](../../specification/05-limites-actuelles.md). Les priorités ci-dessous concernent les travaux proposés.

| Priorité proposée | Évolution                                                                                                   | Constat associé |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | --------------- |
| P1                | Utiliser `sampleRate / fftSize` et vérifier avec un signal de fréquence connue.                             | L01             |
| P1                | Définir la couverture souhaitée ; pour un poster du morceau entier, répartir les lignes sur toute sa durée. | L02             |
| P1                | Réutiliser les données audio pour les changements visuels ; analyser de nouveau seulement ce qui l’exige.   | L03             |
| P1                | Fermer les contextes, organiser la réutilisation et gérer l’obsolescence des calculs.                       | L04             |
| P1                | Afficher une erreur actionnable et associer le résultat aux paramètres qui l’ont produit.                   | L05             |
| P1                | Borner largeur, hauteur et surface en pixels avant allocation et export.                                    | L06             |
| P1                | Unifier les calculs et distinguer résolution d’aperçu et résolution d’export.                               | L07             |
| P2                | Appliquer une palette cohérente et exprimer les proportions selon le support.                               | L08             |
| P2                | Gérer toute la durée et définir explicitement une stratégie mono/stéréo.                                    | L09             |
| P2                | Vérifier les données avant dessin et définir un résultat pour le silence et les fichiers courts.            | L10             |
| P2                | Rendre le déroulement et les erreurs de l’analyse explicites ; vérifier sur les navigateurs ciblés.         | L11             |
| P2                | Mettre les styles simples au premier plan et valider la mise en page mobile.                                | L12             |
| P3                | Conserver une documentation à jour et ajouter des tests ciblés lors des corrections.                        | L13             |

[Retour aux fonctionnalités](../README.md).
