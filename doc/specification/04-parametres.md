# 04 — Paramètres et presets

Le modèle central est [PosterState](../../app/welcome/welcome.types.ts). Ses valeurs initiales proviennent de [DEFAULT_POSTER_STATE](../../app/welcome/welcome.constants.ts). Les contraintes d’interface sont dans [PersonalizationPanel](../../app/welcome/PersonalizationPanel.tsx) et [FormatPanel](../../app/welcome/FormatPanel.tsx) ; elles ne forment pas un validateur indépendant du moteur.

## Format

| Champ                  | Valeur initiale | Utilisation / limite                                           |
| ---------------------- | --------------- | -------------------------------------------------------------- |
| `paperFormat`          | `A4`            | `A4`, `A3`, `CUSTOM`.                                          |
| `posterOrientation`    | `portrait`      | `portrait` ou `landscape` ; échange les dimensions en paysage. |
| `customPosterWidthMm`  | `210`           | Largeur interne personnalisée ; bornes 10–5 000 mm.            |
| `customPosterHeightMm` | `297`           | Hauteur interne personnalisée ; bornes 10–5 000 mm.            |
| `customPosterDpi`      | `300`           | Bornes 30–1 200 ; utilisé seulement en format personnalisé.    |
| `customSizeUnit`       | `cm`            | Unité de saisie `cm` ou `px` ; le stockage reste en mm.        |

Les champs personnalisés ne sont affichés qu’en mode `CUSTOM`. Changer d’unité ne devrait pas modifier le dessin, mais déclenche actuellement un recalcul audio parce que tout l’état est observé par le même effet.

## Apparence et plage affichée

| Champ               | Valeur initiale | Contrôle / effet                                                                        |
| ------------------- | --------------- | --------------------------------------------------------------------------------------- |
| `lineCount`         | `20`            | Curseur de 10 à 200, pas 5 ; le générateur conserve les premières lignes disponibles.   |
| `minFrequency`      | `1500` Hz       | Minimum de saisie 20 Hz, pas 10 ; reste au moins 50 Hz sous la borne haute.             |
| `maxFrequency`      | `4500` Hz       | Maximum de saisie 20 000 Hz, pas 10 ; reste au moins 50 Hz au-dessus de la borne basse. |
| `axisColor`         | `#9ca3af`       | Axes et étiquettes.                                                                     |
| `dataLinesWidth`    | `3` px          | Curseur de 1 à 8, pas 1.                                                                |
| `axisFont`          | `Arial`         | Choix : Arial, Georgia, Courier New, Trebuchet MS, Verdana.                             |
| `strokeColor`       | `#BAB2A9`       | Première couleur du dégradé, partiellement remplacée par le rendu HSL actuel.           |
| `strokeAccentColor` | `#FFBD33`       | Deuxième couleur du dégradé, avec la même limite.                                       |
| `backgroundColor`   | `#1d1d2b`       | Fond du canevas et masquage entre les courbes.                                          |

Les fréquences ci-dessus sont celles affichées par l’interface. Leur correspondance réelle aux bins est affectée par le facteur deux décrit dans le [document 03](03-analyse-audio-et-rendu.md).

## Analyse audio

| Champ                   | Valeur initiale de l’éditeur | Contrôle / effet                                                                      |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `fftSize`               | `2048`                       | Choix : 512, 1 024, 2 048, 4 096, 8 192 ; la sortie a `fftSize / 2` bins par spectre. |
| `smoothingTimeConstant` | `0.5`                        | Curseur 0–1, pas 0,05 ; lissage de l’analyseur.                                       |
| `minDecibels`           | `-100`                       | Minimum de saisie −120 ; reste au moins 5 dB sous `maxDecibels`, pas 5.               |
| `maxDecibels`           | `-30`                        | Maximum de saisie 0 ; reste au moins 5 dB au-dessus de `minDecibels`, pas 5.          |
| `durationBetweenLines`  | `0.5` s                      | Curseur 0,1–2, pas 0,1 ; intervalle entre les prélèvements.                           |

Le constructeur de `AudioAnalyzer` possède aussi ses propres valeurs de secours : lissage `0`, minimum `-90` dB et maximum `-10` dB. Elles diffèrent de celles de l’éditeur, qui transmet toujours ses paramètres dans le parcours actuel.

## Presets

Un `PosterPreset` est un état partiel accompagné de `id` et `description`. Le panneau retire ces deux champs avant d’appliquer les autres avec un patch : le preset ne réinitialise pas l’ensemble de l’état et ne mémorise pas sa propre sélection. `PosterState.id` reste initialement `custom`, avec la description `Custom poster.` ; ces champs ne sont pas un titre libre imprimé sur le poster.

| Identifiant     | Fond      | Trait / accent        | Axes      | Épaisseur | Lissage | Intervalle |
| --------------- | --------- | --------------------- | --------- | --------- | ------- | ---------- |
| `midnight-gold` | `#0f172a` | `#f8fafc` / `#f59e0b` | `#cbd5e1` | 3         | 0,6     | Inchangé.  |
| `sunset-wave`   | `#1f2937` | `#fb7185` / `#f97316` | `#fed7aa` | 4         | 0,4     | Inchangé.  |
| `glacier`       | `#111827` | `#60a5fa` / `#a5f3fc` | `#dbeafe` | 2         | 0,75    | 0,6 s.     |
| `neon-graphite` | `#18181b` | `#22c55e` / `#84cc16` | `#e4e4e7` | 3         | 0,2     | 0,35 s.    |

L’ordre d’application compte : après Glacier, Midnight Gold conserve l’intervalle de 0,6 s. Neon Graphite fixe un intervalle de 0,35 s qui n’est pas aligné sur le pas de 0,1 du curseur ; la valeur reste néanmoins transmise au moteur.
