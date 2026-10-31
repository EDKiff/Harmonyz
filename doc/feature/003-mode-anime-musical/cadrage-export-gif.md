# Cadrage de l’export GIF

Notes historiques de cadrage du **31 octobre 2026**, rédigées avant l’implémentation. La génération est maintenant livrée : voir les [choix réalisés](README.md#choix-livrés-et-limites-restantes) et la [validation](validation/README.md). Les questions et calculs ci-dessous conservent leur contexte préparatoire ; ils ne décrivent pas l’architecture actuelle.

## Référence fonctionnelle

Le [README de la feature](README.md#décisions-validées) est la référence pour les comportements validés : couverture, dimensions, cadence, préparation pendant l’écoute, export à la demande, personnalisation et indépendance du lecteur. Les présentes notes regroupent les contraintes vérifiées, les calculs et les questions techniques nécessaires à leur réalisation.

Les calculs ci-dessous emploient la cadence retenue de 20 images/s et une durée illustrative de quatre minutes. Cette durée n’est pas une limite de durée validée.

## Faits documentés

La spécification GIF89a définit un délai d’affichage en centièmes de seconde pour les images. Une cadence de 20 images/s correspond à un délai de cinq centièmes par image. Ce calcul décrit une cadence encodable ; il ne garantit pas les performances de génération ou de lecture. Source : [spécification GIF89a, Graphic Control Extension, Delay Time](https://www.w3.org/Graphics/GIF/spec-gif89a.txt).

Les pixels d’un `ImageData` au format `rgba-unorm8` utilisent quatre composantes de huit bits, soit quatre octets par pixel. Source : [documentation MDN de ImageData.data](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data).

Le poster A4 actuel mesure 840 × 1 188 px en portrait : voir les [dimensions du canevas existant](../../specification/03-analyse-audio-et-rendu.md#dimensions-du-canevas), vérifiées dans les [constantes](../../../app/welcome/welcome.constants.ts) et le [calcul des dimensions](../../../app/welcome/welcome.tsx).

## Calculs théoriques

Pour un exemple de morceau de quatre minutes à 20 images/s :

```text
Nombre d’images = 240 × 20 = 4 800
Volume brut RGBA8 d’une image = largeur × hauteur × 4 octets
```

| Dimensions d’une image | Volume brut par image | Volume brut pour 4 800 images |
| ---------------------- | --------------------- | ----------------------------- |
| 840 × 1 188 px         | 3 991 680 octets      | 19,16 Go                      |

Les Go sont exprimés en milliards d’octets. Pour un autre format de poster, le même calcul utilise ses dimensions réelles en pixels.

Ces volumes sont des **calculs de données brutes cumulées**, pas des estimations de taille du GIF compressé. Ils ne décrivent une occupation mémoire simultanée que si toutes les images RGBA8 sont conservées ensemble. Ils ne permettent pas de prédire le temps de génération, le poids du fichier final ou la mémoire réellement consommée par un futur encodeur.

## Étude de la génération progressive

Pour réaliser le [comportement de génération progressive et d’export](README.md#export-progressif-et-cadence), l’étude technique doit distinguer :

- La préparation et l’analyse des données audio.
- La production successive des images de l’animation.
- L’encodage des images et la gestion des données du GIF déjà produites.
- La finalisation et la disponibilité du fichier complet.

Il reste à déterminer quelles données peuvent être réutilisées entre l’écoute et l’export, comment les associer au fichier et aux réglages qui les ont produites et comment compléter les passages non préparés. Le choix doit respecter le [comportement validé de personnalisation et d’indépendance de l’export](README.md#export-progressif-et-cadence).

Le stockage des données encodées reste à choisir : la demande fonctionnelle ne fixe pas une API d’écriture sur disque ou une bibliothèque. Leur faisabilité et leur compatibilité doivent être étudiées sur les appareils ciblés.

Déduction des calculs ci-dessus : traiter les images successivement peut éviter de conserver toutes les images brutes simultanément. Cela ne détermine pas la taille du GIF compressé, la mémoire utilisée pour ses données encodées ou le temps de génération. Ces propriétés dépendent du fonctionnement et de l’encodeur qui seront retenus.

## Plan de vérification établi au cadrage

- Qualité du mouvement et du raccord sur les deux styles, aux dimensions du poster et à la cadence retenue.
- Empilement complet dès la première image, avec les courbes de fin au-dessus de celles du début, selon le [comportement initial validé](README.md#décisions-validées).
- Respect de la durée et de la couverture du morceau entier, y compris sa fraction de seconde finale.
- Cadence nominale de 20 images/s et gestion de la durée finale à la précision temporelle permise par le format GIF.
- Production du GIF complet sans écoute préalable et après une écoute partielle avec navigation dans le morceau.
- Conservation de l’état et de la position du lecteur lors d’un export lancé en pause ou pendant la lecture.
- Application des réglages présents au lancement de l’export à l’ensemble du GIF, après des modifications de personnalisation pendant l’écoute.
- Poursuite d’un export après le chargement d’un autre morceau, avec livraison du GIF de l’ancien morceau et de ses réglages de lancement, selon le [comportement validé](README.md#décisions-validées).
- Temps de génération, mémoire et taille du GIF sur des morceaux et appareils représentatifs, en couvrant l’ordinateur et le téléphone selon le [périmètre validé](README.md#décisions-validées).
- Stratégie de traitement des images évitant de conserver l’ensemble des images brutes simultanément ; faisabilité à vérifier dans le choix de l’encodeur.
- Maintien d’un éditeur utilisable pendant la génération, affichage de la progression et annulation, selon le [comportement validé](README.md#décisions-validées), ainsi que gestion des erreurs à définir.

Cette liste est le plan historique de vérification, pas un rapport de résultats. Consulter la [recette](validation/README.md) pour les contrôles réellement exécutés et leurs limites. Les comportements validés restent définis dans le [README de la feature](README.md#décisions-validées).

[Retour à la feature 003](README.md).
