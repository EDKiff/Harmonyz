# Première validation — style Joy Division

Recette locale du 31 octobre 2026, avec Chromium 156 automatisé via Playwright. Ces contrôles vérifient une première version ; l’appréciation visuelle de l’utilisateur reste à recueillir.

## Images de référence et de résultat

- [Référence fournie](../s-l1600.webp), conservée sans modification.
- [Poster portrait issu de song.mp3](song-portrait.png) : 840 × 1 188 px.
- [Poster paysage issu de song.mp3](song-landscape.png) : 1 188 × 840 px.
- [Comparaison côte à côte](comparaison.png) : référence complète à gauche, rendu portrait à droite. Les textes de la référence sont hors périmètre.

Réglages du nouveau style : 80 lignes, intervalle 0,5 s, FFT 4 096, lissage 0,5, plage affichée 1 500–4 500 Hz, bornes −100/−30 dB, deux couleurs blanches, fond noir et épaisseur de référence 3. Audio : [song.mp3](../../../../song.mp3). L’analyseur historique conserve son décalage fréquentiel documenté ; les Hz ci-dessus sont les valeurs affichées.

## Lecture visuelle

Le premier rendu conserve les lignes fines serrées, les bords atténués, les pics centraux irréguliers et les occultations. Après une première image, le cadrage a été ajusté pour éviter une réserve vide au-dessus des premières lignes calmes, et la FFT du nouveau style portée à 4 096 pour mieux détailler les contours.

Les zones de faible relief et les pics correspondent au morceau utilisé, et ne cherchent pas à reproduire les pics exacts de la référence. L’étalement central, la hauteur des reliefs et la finesse des contours pourront être ajustés à partir des retours sur ces images.

## Contrôles

Le [script de recette](verification.cjs) utilise Playwright installé séparément et le serveur de production local. Il réécrit les trois images de résultat avec le code et l’audio présents. Exemple après `npm run build`, avec un serveur lancé par `PORT=3180 npm start` :

```bash
PLAYWRIGHT_MODULE=/chemin/vers/playwright node doc/feature/002-style-joy-division/validation/verification.cjs
```

`PLAYWRIGHT_MODULE` est facultatif si le module `playwright` est résolu normalement ; `HARMONYZ_URL` permet de changer l’adresse du serveur. Le navigateur Chromium et ses bibliothèques système doivent être disponibles. Aucune dépendance de test n’est ajoutée à `package.json`.

Résultats sur la dernière version :

| Contrôle                  | Résultat                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`       | Réussi.                                                                                                                     |
| `npm run build`           | Réussi, client et serveur.                                                                                                  |
| `npm run lint`            | Réussi sur le dépôt.                                                                                                        |
| Import réel de `song.mp3` | Rendu obtenu dans Chromium.                                                                                                 |
| Réglages par style        | Couleurs, nombre de lignes et intervalle retrouvés après changement de style ; réglages d’axes masqués dans Joy Division.   |
| Preset Glacier            | Appliqué au seul style actif, sans changement de style ni modification de l’intervalle de Spectrum.                         |
| Cache audio               | Modifier la couleur n’instancie pas de nouvel `AudioContext`.                                                               |
| Déterminisme              | Après aller-retour entre styles et restauration des réglages, PNG identique au premier rendu.                               |
| Export                    | Fichier téléchargé identique au contenu du canevas affiché.                                                                 |
| Format paysage commun     | Canevas de 1 188 × 840 px dans les deux styles ; retour portrait vérifié.                                                   |
| Dynamique                 | Sur deux spectres étalons de même forme, le plus faible produit un relief inférieur ; échelles partagées.                   |
| Cas dégénérés au tracé    | Silence, une seule valeur, plage vide, séries vides et valeurs non finies : aucune coordonnée non finie transmise au tracé. |
| Petit écran               | Sélecteur de style visible à 390 × 844 ; ce contrôle ne vaut pas recette complète du mobile.                                |
| Erreurs JavaScript        | Aucune erreur de page pendant la recette.                                                                                   |
| Documentation             | 99 liens locaux vérifiés, aucune cible manquante ; `git diff --check` réussi.                                               |

Aucun test Safari/Firefox ni retour utilisateur sur les images n’a encore été effectué. Les limites historiques hors périmètre sont suivies dans les [limites de l’existant](../../../specification/05-limites-actuelles.md).

[Retour à la feature 002](../README.md).
