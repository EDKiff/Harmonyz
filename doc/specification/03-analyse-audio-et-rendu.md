# 03 — Analyse audio et rendu

Ce document décrit le comportement après le développement de la [feature 003 — mode animé musical](../feature/003-mode-anime-musical/README.md), le **31 octobre 2026**. Les constats de l’audit initial du même jour, réalisé au commit `882e6188a57e60ac6cca575a505b2c44d9156fed`, sont conservés dans la [note historique](#évolution-depuis-laudit-initial) lorsqu’ils ont été corrigés.

## Du fichier aux séries spectrales

La chaîne est implémentée dans [PosterGenerator](../../app/renderer/PosterGenerator.ts) et [AudioAnalyzer](../../app/renderer/AudioAnalyzer.ts). `PosterGenerator.analyze(file, params)` expose l’analyse complète ; `generate(file, lineCount, params)` reste disponible pour sélectionner les premières lignes du poster fixe.

Le générateur consulte un cache borné à quatre analyses par fichier, indexées par FFT, lissage, décibels et intervalle entre les lignes. Sur un cache manquant :

1. `File.arrayBuffer()` lit tout le fichier en mémoire.
2. Un nouvel `AudioContext` décode le fichier via `decodeAudioData` et fournit sa durée exacte, fraction de seconde comprise.
3. Un `OfflineAudioContext` mono est créé à la fréquence d’échantillonnage du buffer décodé, avec une longueur augmentée de 128 échantillons. Cette marge d’un quantum permet à la dernière suspension d’aboutir lorsque son arrondi tombe après la fin du son. La durée publique reste celle du morceau, sans cette marge.
4. Le canal d’index `0` est copié dans un buffer mono. Les autres canaux ne sont pas mixés.
5. Le graphe `BufferSource → AnalyserNode → destination hors ligne` reçoit FFT, lissage et bornes de décibels. Les bornes sont appliquées sans croiser transitoirement la plage par défaut de l’analyseur.
6. Des suspensions sont programmées aux temps `0, Δt, 2Δt…`, strictement inférieurs à la durée exacte.
7. À chaque suspension, `getByteFrequencyData()` relève un spectre, copié dans un tableau de nombres entre 0 et 255, puis le rendu hors ligne reprend. L’analyse attend le rendu et les suspensions avant de rendre ses données.
8. Le contexte audio est fermé en fin d’analyse, y compris en cas d’échec. Les résultats en échec sont retirés du cache pour permettre une nouvelle tentative.

Le résultat contient `xAxis`, `frequencyData` et `duration`. Les apparences, formats et nombres de lignes réutilisent les spectres sans décoder de nouveau le fichier. La quantification des suspensions dépend du moteur Web Audio ; leur arrondi au quantum est défini par la [spécification Web Audio](https://www.w3.org/TR/webaudio/#dom-offlineaudiocontext-suspend).

L’analyse hors ligne ne joue pas la musique sur la sortie sonore de l’utilisateur. La lecture audible utilise séparément un élément `<audio>` piloté par [useSongPlayback](../../app/welcome/useSongPlayback.ts). L’analyse ne détecte ni tempo, ni tonalité, ni instruments, ni paroles. Les notes affichées sont des repères statiques, pas le résultat d’une transcription musicale.

### Couverture temporelle et fréquences

Pour une durée décodée `D > 0`, un intervalle positif `Δt` et une limite de lignes `L` :

```text
N = ceil(D / Δt)
M = min(L, N)
Temps demandés : 0, Δt, …, (N - 1) × Δt
Fréquence du bin i = i × sampleRate / fftSize
Nombre de bins = fftSize / 2
```

Le poster fixe conserve les `M` premières tranches. Avec les valeurs initiales de Spectrum (`L = 20`, `Δt = 0,5 s`), il représente les temps demandés de 0 à 9,5 secondes au maximum. L’animation utilise toute l’analyse ; elle n’est pas limitée aux premières tranches.

Les morceaux de moins d’une seconde ont désormais au moins une tranche. L’intervalle doit être fini et strictement positif. À 44 100 Hz avec une FFT de 2 048 points, le bin 100 correspond à environ 2 153 Hz ; les filtres et les repères utilisent cette fréquence.

## Du spectre au dessin

[PosterRenderer.drawPoster](../../app/renderer/PosterRenderer.ts) est l’opération commune à l’aperçu, au PNG et aux images du GIF. Elle accepte un contexte Canvas 2D ou OffscreenCanvas 2D, remplit le fond et filtre les bins entre `minFrequency` et `maxFrequency` incluses. Les valeurs non finies sont remplacées par zéro.

[PosterComponent](../../app/renderer/PosterComponent.tsx) appelle cette opération dans un effet de mise en page React. Les changements de réglages sont différés de 250 ms ; pendant un nouveau calcul, l’ancien visuel reste affiché et la musique continue. Le nouveau résultat utilise la position alors courante, sans relancer le morceau.

### Spectrum

Le style utilise une échelle fréquentielle linéaire et des courbes de Bézier. La marge vaut 50 pixels aux dimensions habituelles et diminue pour les petits canevas. Les notes naturelles de `NOTES` apparaissent sur l’axe horizontal ; les notes diésées ou bémolisées sont ignorées.

En fixe, les rangées sont espacées selon leur index, avec une normalisation verticale calculée sur `index + amplitude / 255`. Les étiquettes affichent `index × durationBetweenLines` avec une décimale. Les reliefs ont une hauteur de référence de 50 pixels. Une plage contenant moins de deux bins ou des séries vides laisse le fond ; une amplitude uniforme ne produit pas de division par zéro.

En animé, les rangées conservent des hauteurs fixes et le relief maximal ne change pas avec les amplitudes de l’image courante. Les repères sont des décalages fixes par rapport à la lecture : `0 s` en bas, puis `−Δt`, `−2Δt`, etc. Les notes restent présentes. Ces repères s’appliquent aussi au GIF.

Chaque rangée masque les courbes précédentes sous son contour, puis utilise les couleurs Stroke et Accent sur tout son tracé. Un chemin et un dégradé sont construits par rangée, plutôt qu’un dégradé par bin. Les marges, la police et les reliefs de Spectrum ne sont pas proportionnels au DPI ; les petits canevas adaptent leurs marges et leur police.

### Joy Division

[JoyDivisionRenderer](../../app/renderer/JoyDivisionRenderer.ts) utilise les mêmes spectres filtrés. Valeurs initiales : 80 lignes, FFT 4 096, traits blancs de largeur de référence 3, fond noir ; les autres paramètres audio et la plage fréquentielle restent ceux du socle initial.

Le dessin applique une échelle d’amplitude commune, une puissance 2,2 pour accentuer les contrastes et une enveloppe centrée `exp(-0,5 × ((u - 0,5) / 0,16)²) × sin(πu)`, où `u` parcourt la largeur de 0 à 1. Aucune normalisation par ligne ni aucun bruit aléatoire n’est ajouté. Le silence produit des lignes plates. Les points sont reliés par segments avec jointures arrondies.

Les marges horizontales valent 5,5 % de la largeur et les marges verticales 6,5 % de la hauteur. La hauteur maximale des reliefs est le minimum de 24 % de la largeur utile et de 18 % de la hauteur. En fixe, les contours réels sont ajustés à la hauteur utile avec une échelle verticale commune et le maximum des spectres affichés. En animé, le maximum provient du morceau entier dans la plage de fréquences choisie ; la réserve verticale et les rangées sont fixes pour éviter les changements d’échelle entre images. L’épaisseur est proportionnelle au plus petit côté, avec 840 px comme référence.

Chaque ligne remplit la zone située sous son contour avec la couleur du fond avant de tracer celui-ci, de haut en bas. Les reliefs suivants occultent ainsi les lignes précédentes. Le trait utilise Stroke et Accent via un dégradé vertical. Aucun axe ni texte n’est tracé. Les plages vides et les amplitudes nulles ne produisent pas de division par zéro.

## Animation et raccord de boucle

[animationFrame](../../app/renderer/animation.ts) évalue les spectres à partir du temps de lecture, pris modulo la durée décodée. La rangée du bas correspond au temps courant, celles du dessus aux temps `t − Δt`, `t − 2Δt`, etc. L’empilement est donc complet dès le début, avec les données de fin au-dessus de celles du début. Un morceau plus court que l’empilement est répété pour remplir ses rangées.

Entre deux prélèvements, les amplitudes sont interpolées linéairement ; chaque rangée rejoint progressivement la forme de celle située en dessous. L’intervalle `durationBetweenLines` règle cette transformation sans modifier la vitesse de la musique. La dernière tranche rejoint la première pendant la fraction de durée restante, même lorsque `D` n’est pas un multiple de `Δt`. L’état à `t = D` est celui de `t = 0`, sans rallonger le morceau.

L’aperçu vise 20 images/s depuis l’horloge de l’élément audio ; la navigation évalue directement l’état correspondant au passage demandé. Le lecteur reprend automatiquement au début et l’animation suit cette reprise. La cadence effective et la fluidité dépendent du navigateur et de l’appareil ; les contrôles exécutés et leurs limites sont consignés dans la [documentation de vérification](06-developpement-et-verification.md).

## Dimensions du canevas

Les calculs sont répartis entre [Welcome](../../app/welcome/welcome.tsx), [FormatPanel](../../app/welcome/FormatPanel.tsx) et les [constantes](../../app/welcome/welcome.constants.ts).

| Format       | Taille de base                 | Taille du canevas en portrait                  |
| ------------ | ------------------------------ | ---------------------------------------------- |
| A4           | 210 × 297 mm                   | 840 × 1 188 px.                                |
| A3           | 297 × 420 mm                   | 1 188 × 1 680 px.                              |
| Personnalisé | Largeur/hauteur internes en mm | `round(mm / 25,4 × DPI)` sur chaque dimension. |

Les formats standards utilisent **4 pixels par millimètre**, soit une densité calculée de 101,6 pixels par pouce. Le DPI initial de 300 ne s’applique qu’au mode personnalisé. À titre de comparaison, 210 × 297 mm à 300 DPI donne 2 480 × 3 508 pixels.

Le mode paysage échange largeur et hauteur de base, y compris pour les dimensions personnalisées. Il ne trie pas les valeurs pour garantir que la largeur soit supérieure à la hauteur. La saisie en cm est convertie en mm ; la saisie en px est convertie en mm à l’aide du DPI courant. Changer ensuite le DPI conserve les millimètres internes et modifie le nombre de pixels.

Les dimensions et le DPI sont bornés au calcul ; les champs sont aussi normalisés à la perte du focus. Avant d’allouer le canevas, [validateGifDimensions](../../app/animation/gifTimeline.ts) impose des dimensions entières positives, **4 096 px au maximum par côté et 16 000 000 pixels au total**. Cette protection concerne l’aperçu et les exports PNG/GIF. Un format trop grand affiche une erreur et doit être réduit ; il n’est pas redimensionné silencieusement.

## Exports PNG et GIF

Le menu du bouton de téléchargement propose PNG et GIF dès que l’analyse et le format sont prêts, même sans écoute préalable. Les fichiers contiennent uniquement le dessin et reprennent les dimensions du poster :

```text
<nom-du-fichier-sans-extension>-<largeurMm>x<hauteurMm>mm.png
<nom-du-fichier-sans-extension>-<largeurMm>x<hauteurMm>mm.gif
```

Le PNG est dessiné séparément avec les premières tranches du poster fixe puis converti en `Blob`. Il reste donc fixe même si le téléchargement est demandé pendant l’écoute. Il n’insère pas explicitement de métadonnées DPI. Aucun PDF ni SVG n’est implémenté ; les millimètres inscrits dans le nom ne suffisent pas à imposer une taille d’impression au logiciel qui ouvrira le fichier.

Le GIF est muet et configuré pour une répétition infinie. [GifPreparation](../../app/animation/GifPreparation.ts) conserve une configuration de l’analyse, du style, des réglages et des dimensions. Le [worker GIF](../../app/animation/gif.worker.ts) dessine successivement les images dans un OffscreenCanvas et les encode avec `gifenc` ; les blocs encodés sont conservés temporairement dans IndexedDB, indexés par numéro d’image. Les images brutes ne sont pas conservées ensemble.

Pendant l’écoute, les positions visitées alimentent cette préparation. Demander le GIF complète les images manquantes et assemble les blocs dans l’ordre chronologique du morceau entier, à **20 images/s**. Les délais GIF sont de cinq centièmes par image ; la dernière image reçoit le délai restant après arrondi de la durée au centième le plus proche, avec une durée minimale d’un centième. L’export ne déplace pas la lecture et ne change pas son état.

La préparation est remplacée après un changement de réglages ; un export déjà lancé conserve sa configuration et son morceau jusqu’à son terme, même si l’éditeur change de fichier. La progression et l’annulation concernent cet export. L’encodage s’effectue dans un worker et laisse l’éditeur utilisable. Les données temporaires sont supprimées lorsque leur préparation est libérée ; la fermeture de la page abandonne le travail courant.

Le navigateur doit prendre en charge Web Workers, OffscreenCanvas 2D et IndexedDB. Une absence d’API, une erreur de génération ou un quota de stockage insuffisant donne un message de reprise. Le fichier final est assemblé en `Blob` avant téléchargement : la préparation successive évite l’accumulation des images RGBA, mais ne garantit pas une consommation mémoire ou un espace disque indépendants de la taille du GIF. Les limites de taille, de durée et de performance doivent être appréciées avec la [recette de la feature 003](../feature/003-mode-anime-musical/README.md).

## Évolution depuis l’audit initial

L’audit du **31 octobre 2026**, au commit `882e6188a57e60ac6cca575a505b2c44d9156fed`, avait relevé des prélèvements limités à `floor(D)`, l’absence de lignes sous une seconde, des fréquences multipliées par deux, une palette Spectrum partiellement remplacée par des couleurs HSL et un export PNG prélevé directement dans le canevas affiché. Ces descriptions sont historiques : les corrections de la feature 003 sont celles décrites dans les sections courantes ci-dessus. Les autres limites du produit sont regroupées dans [05 — Limites actuelles](05-limites-actuelles.md).
