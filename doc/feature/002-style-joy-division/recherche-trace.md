# Recherche — tracé de courbes inspirées de Joy Division

Recherche du 31 octobre 2026 pour la [feature 002](README.md), par lecture du code public. Aucune démo exécutée ni aucun code tiers intégré ; les recommandations restent des propositions.

## 1. Référence principale : venkat24

Version examinée : `0462c59ba5bacf4ff3c7f4eac85c465487fae316`.

**Faits vérifiés.** Le programme conserve un historique de spectres FFT. Chaque ligne suit un bin fréquentiel dans cet historique : horizontalement se trouve donc le temps, tandis que les lignes distinguent les fréquences. `transformWithWeights` multiplie les amplitudes par une gaussienne plafonnée, ce qui réduit les bords et conserve une région centrale plus large. Le plafond varie aléatoirement selon la ligne. `curveVertex` lisse le tracé ; un remplissage noir permet aux courbes de devant de masquer celles de derrière. Sources : [script.js](https://github.com/venkat24/unknown-pleasures/blob/0462c59ba5bacf4ff3c7f4eac85c465487fae316/script.js), [constantes](https://github.com/venkat24/unknown-pleasures/blob/0462c59ba5bacf4ff3c7f4eac85c465487fae316/constants.js).

**Déduction pour Harmonyz.** L’enveloppe centrale et le masquage sont des techniques utiles indépendamment de la bibliothèque p5.js. Leur emploi ne demande pas de reprendre la disposition des données du projet : Harmonyz peut conserver une ligne par tranche temporelle et les fréquences sur l’axe horizontal, comme dans son [rendu actuel](../../specification/03-analyse-audio-et-rendu.md).

## 2. Référence d’aspect : poeti8

Version examinée : `ff4db544fd1bd29ea1d0bce42ea2c3834d9f1359`.

**Faits vérifiés.** Three.js fournit les bins audio ; le composant `Lines` associe un bin à chaque ligne et module son amplitude. Le shader combine plusieurs couches de bruit cohérent, réduites vers les extrémités par une enveloppe centrée. Des plans accompagnent les lignes dans la scène 3D. Il ne s’agit pas d’un historique de spectres dessiné directement. Sources : [analyse audio](https://github.com/poeti8/unknown-pleasures/blob/ff4db544fd1bd29ea1d0bce42ea2c3834d9f1359/src/components/Audio/Audio.tsx), [mise à jour des lignes](https://github.com/poeti8/unknown-pleasures/blob/ff4db544fd1bd29ea1d0bce42ea2c3834d9f1359/src/components/Lines/Lines.tsx), [shader du relief](https://github.com/poeti8/unknown-pleasures/blob/ff4db544fd1bd29ea1d0bce42ea2c3834d9f1359/src/shaders/line/line.vertex.glsl), [lignes et plans](https://github.com/poeti8/unknown-pleasures/blob/ff4db544fd1bd29ea1d0bce42ea2c3834d9f1359/src/components/Line/Line.tsx).

**Déduction pour Harmonyz.** Le principe de bords atténués est pertinent. Reprendre les pics procéduraux rendrait en revanche le dessin moins directement lié aux mesures audio, et la scène WebGL apporterait une complexité peu utile au poster Canvas 2D.

## 3. Référence de tracé : garrettdreyfus

Version examinée : `cc8b8ef3473574106b5b5d6b4aeae36a668979b5`.

**Faits vérifiés.** `Wave.draw` parcourt horizontalement le canevas et relie les points avec `lineTo`, puis applique `stroke`. La classe utilise des décalages aléatoires et une fonction de courbe fournie à son constructeur ; cette méthode ne remplit pas la zone sous la courbe pour masquer les lignes précédentes. Le README décrit un outil de dessin interactif. Sources : [wave.js](https://github.com/garrettdreyfus/unknownpleasures/blob/cc8b8ef3473574106b5b5d6b4aeae36a668979b5/wave.js), [README](https://github.com/garrettdreyfus/unknownpleasures/blob/cc8b8ef3473574106b5b5d6b4aeae36a668979b5/README.md).

**Déduction.** Utile pour le tracé Canvas 2D, insuffisant pour la chaîne audio et le masquage.

## Proposition pour la feature

S’inspirer principalement de venkat24 pour la construction graphique, en conservant les données et la couverture temporelle décidées pour Harmonyz :

1. Utiliser les amplitudes du spectre audio pour les reliefs ; conserver une ligne par tranche et les fréquences horizontalement.
2. Appliquer une enveloppe centrale déterministe aux amplitudes pour diminuer les reliefs sur les bords. La largeur et la forme exactes de cette enveloppe restent à choisir.
3. Tracer les lignes dans un ordre constant, remplir leur zone inférieure avec la couleur de fond pour masquer celles de derrière, puis dessiner le contour avec la couleur choisie.
4. Comparer l’espacement, la hauteur, la largeur de la zone centrale et les occultations à la [référence fournie](s-l1600.webp), sans exiger que les pics de deux sources différentes soient identiques.

Ne pas ajouter de bruit aléatoire pour fabriquer des pics : cette recommandation vise à conserver un résultat reproductible, dont les variations proviennent de l’audio. Le niveau de lissage reste à régler visuellement.

**Réutilisation de code.** Aucune licence explicite n’a été identifiée dans les arborescences des trois versions examinées ; l’API GitHub renvoie également `license: null` pour ces dépôts au moment de la recherche. La recommandation porte sur les techniques observées et une implémentation propre à Harmonyz, sans reprise de code tiers. Sources de ce constat : [venkat24](https://api.github.com/repos/venkat24/unknown-pleasures), [poeti8](https://api.github.com/repos/poeti8/unknown-pleasures), [garrettdreyfus](https://api.github.com/repos/garrettdreyfus/unknownpleasures).

Piste non consultable avec l’outil web : `smallcircles.net/waveforms`.

[Retour à la feature 002](README.md).
