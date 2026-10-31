# 04 — Paramètres et presets

Mis à jour le **31 octobre 2026** avec la [feature 003 — mode animé musical](../feature/003-mode-anime-musical/README.md).

Le modèle central est [PosterState](../../app/welcome/welcome.types.ts). Le [modèle d’édition](../../app/welcome/posterEditorState.ts) sépare le format commun des réglages propres à chaque style. Les tableaux ci-dessous décrivent les valeurs initiales de Spectrum, issues de [DEFAULT_POSTER_STATE](../../app/welcome/welcome.constants.ts). Joy Division démarre avec 80 lignes, une FFT de 4 096, un fond noir, deux couleurs de trait blanches et une épaisseur de référence 3. Les autres valeurs initiales sont communes aux deux styles ; leurs modifications sont ensuite indépendantes. Les contraintes d’interface sont dans [PersonalizationPanel](../../app/welcome/PersonalizationPanel.tsx) et [FormatPanel](../../app/welcome/FormatPanel.tsx) ; elles ne forment pas un validateur indépendant du moteur.

## Format

| Champ                  | Valeur initiale | Utilisation / limite                                           |
| ---------------------- | --------------- | -------------------------------------------------------------- |
| `paperFormat`          | `A4`            | `A4`, `A3`, `CUSTOM`.                                          |
| `posterOrientation`    | `portrait`      | `portrait` ou `landscape` ; échange les dimensions en paysage. |
| `customPosterWidthMm`  | `210`           | Largeur interne personnalisée ; bornes 10–5 000 mm.            |
| `customPosterHeightMm` | `297`           | Hauteur interne personnalisée ; bornes 10–5 000 mm.            |
| `customPosterDpi`      | `300`           | Bornes 30–1 200 ; utilisé seulement en format personnalisé.    |
| `customSizeUnit`       | `cm`            | Unité de saisie `cm` ou `px` ; le stockage reste en mm.        |

Les champs personnalisés ne sont affichés qu’en mode `CUSTOM`. Changer d’unité demande une génération mais réutilise l’analyse en cache. Les bornes en millimètres et en DPI ne garantissent pas à elles seules un canevas admissible : l’aperçu et les deux exports imposent aussi 4 096 px par côté et 16 000 000 pixels au total. Un format dépassant ces limites affiche une erreur ; il faut réduire les dimensions ou le DPI. Les conversions sont détaillées dans [03 — Analyse audio et rendu](03-analyse-audio-et-rendu.md#dimensions-du-canevas).

## Apparence et plage affichée

| Champ               | Valeur initiale | Contrôle / effet                                                                                         |
| ------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `lineCount`         | `20`            | Curseur de 10 à 200, pas 5 ; premières lignes disponibles en fixe, nombre de rangées complètes en animé. |
| `minFrequency`      | `1500` Hz       | Minimum de saisie 20 Hz, pas 10 ; reste au moins 50 Hz sous la borne haute.                              |
| `maxFrequency`      | `4500` Hz       | Maximum de saisie 20 000 Hz, pas 10 ; reste au moins 50 Hz au-dessus de la borne basse.                  |
| `axisColor`         | `#9ca3af`       | Axes et étiquettes.                                                                                      |
| `dataLinesWidth`    | `3` px          | Curseur de 1 à 8, pas 1.                                                                                 |
| `axisFont`          | `Arial`         | Choix : Arial, Georgia, Courier New, Trebuchet MS, Verdana.                                              |
| `strokeColor`       | `#BAB2A9`       | Première couleur du dégradé appliqué à toute la courbe.                                                  |
| `strokeAccentColor` | `#FFBD33`       | Deuxième couleur du dégradé appliqué à toute la courbe.                                                  |
| `backgroundColor`   | `#1d1d2b`       | Fond du canevas et masquage entre les courbes.                                                           |

Les fréquences sont celles des bins FFT (`i × sampleRate / fftSize`), utilisées par le filtre et les notes. Le facteur deux relevé lors de l’audit initial a été corrigé ; voir [03 — Analyse audio et rendu](03-analyse-audio-et-rendu.md#couverture-temporelle-et-fréquences).

## Analyse audio

| Champ                   | Valeur initiale de l’éditeur | Contrôle / effet                                                                                          |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `fftSize`               | `2048`                       | Choix : 512, 1 024, 2 048, 4 096, 8 192 ; la sortie a `fftSize / 2` bins par spectre.                     |
| `smoothingTimeConstant` | `0.5`                        | Curseur 0–1, pas 0,05 ; lissage de l’analyseur.                                                           |
| `minDecibels`           | `-100`                       | Minimum de saisie −120 ; reste au moins 5 dB sous `maxDecibels`, pas 5.                                   |
| `maxDecibels`           | `-30`                        | Maximum de saisie 0 ; reste au moins 5 dB au-dessus de `minDecibels`, pas 5.                              |
| `durationBetweenLines`  | `0.5` s                      | Curseur 0,1–2, pas 0,1 ; intervalle entre prélèvements et durée de transformation entre rangées en animé. |

Le constructeur de `AudioAnalyzer` possède aussi ses propres valeurs de secours : lissage `0`, minimum `-90` dB et maximum `-10` dB. Elles diffèrent de celles de l’éditeur, qui transmet toujours ses paramètres dans le parcours actuel.

Les contrôles Axis color et Axis font sont masqués dans Joy Division. Dans Spectrum animé, la rangée du bas porte le repère `0 s`, puis les rangées au-dessus portent `−Δt`, `−2Δt`, etc. ; le poster fixe conserve ses repères absolus de tranche. Les notes restent affichées dans Spectrum et Joy Division reste sans axes.

## Modes, lecture et export

Les réglages d’apparence et d’analyse d’un style sont partagés entre fixe et animé. Play lance l’écoute et l’animation ; Stop remet le poster fixe en conservant la position. Changer de mode ne réinitialise pas les couleurs, l’épaisseur, la plage fréquentielle, le nombre de lignes ou les réglages audio. Les valeurs des autres styles restent indépendantes. Le format (orientation, dimensions, unité et DPI compris) et le fichier sont communs à tous les styles.

La position, la durée et le volume du lecteur sont séparés de `PosterState`. Le son reste à vitesse normale. La cadence nominale est fixée à 20 images/s pour le GIF et visée à la même valeur pour l’aperçu ; aucun réglage de cadence supplémentaire n’est exposé. Un changement de personnalisation laisse la musique continuer et le nouveau visuel rejoint sa position courante après le calcul.

L’export GIF conserve les réglages présents à son lancement pour le morceau entier. Les modifications ultérieures, y compris le chargement d’un autre morceau, ne changent pas l’export en cours. Les préparations compatibles peuvent être réutilisées ; un changement de configuration remplace les préparations devenues obsolètes. Les mécanismes d’interpolation, de préparation et d’export sont décrits dans [03 — Analyse audio et rendu](03-analyse-audio-et-rendu.md).

Aucun réglage n’est sauvegardé au rechargement.

## Presets

Les quatre presets sont disponibles pour chaque style et ne changent ni le style de dessin ni l’état du lecteur. Ils ne modifient que les réglages du style actif ; les champs d’axes sont ignorés dans Joy Division.

Un `PosterPreset` est un état partiel accompagné de `id` et `description`. Le panneau retire ces deux champs avant d’appliquer les autres avec un patch : le preset ne réinitialise pas l’ensemble de l’état et ne mémorise pas sa propre sélection. `PosterState.id` reste initialement `custom`, avec la description `Custom poster.` ; ces champs ne sont pas un titre libre imprimé sur le poster.

| Identifiant     | Fond      | Trait / accent        | Axes      | Épaisseur | Lissage | Intervalle |
| --------------- | --------- | --------------------- | --------- | --------- | ------- | ---------- |
| `midnight-gold` | `#0f172a` | `#f8fafc` / `#f59e0b` | `#cbd5e1` | 3         | 0,6     | Inchangé.  |
| `sunset-wave`   | `#1f2937` | `#fb7185` / `#f97316` | `#fed7aa` | 4         | 0,4     | Inchangé.  |
| `glacier`       | `#111827` | `#60a5fa` / `#a5f3fc` | `#dbeafe` | 2         | 0,75    | 0,6 s.     |
| `neon-graphite` | `#18181b` | `#22c55e` / `#84cc16` | `#e4e4e7` | 3         | 0,2     | 0,35 s.    |

L’ordre d’application compte : après Glacier, Midnight Gold conserve l’intervalle de 0,6 s. Neon Graphite fixe un intervalle de 0,35 s qui n’est pas aligné sur le pas de 0,1 du curseur ; la valeur reste néanmoins transmise au moteur.
