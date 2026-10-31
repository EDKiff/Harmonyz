# 03 — Analyse audio et rendu

## Du fichier aux séries spectrales

La chaîne actuelle est implémentée dans [PosterGenerator](../../app/renderer/PosterGenerator.ts) et [AudioAnalyzer](../../app/renderer/AudioAnalyzer.ts).

1. `File.arrayBuffer()` lit tout le fichier en mémoire.
2. Un nouvel `AudioContext` décode le fichier via `decodeAudioData`.
3. Un `OfflineAudioContext` mono est créé pour la longueur et la fréquence d’échantillonnage du buffer décodé.
4. Le canal d’index `0` est copié dans un buffer mono. Les autres canaux ne sont pas mixés.
5. Le graphe `BufferSource → AnalyserNode → destination hors ligne` est préparé. L’analyseur reçoit FFT, lissage et bornes de décibels.
6. Des suspensions sont programmées aux temps `0, Δt, 2Δt…`, strictement inférieurs à la durée tronquée en secondes entières.
7. À chaque suspension, `getByteFrequencyData()` relève un spectre, copié dans un tableau de nombres, puis le rendu hors ligne reprend.
8. Après le rendu complet, le générateur conserve `slice(0, min(lineCount, nombreDeSpectres))`.

L’analyse ne joue pas la musique sur la sortie sonore de l’utilisateur. Elle ne détecte ni tempo, ni tonalité, ni instruments, ni paroles. Les notes affichées sont des repères statiques, pas le résultat d’une transcription musicale.

### Couverture temporelle réelle

Pour une durée décodée `D`, un intervalle `Δt` et une limite de lignes `L`, le nombre de suspensions programmées vaut approximativement :

```text
N = ceil(floor(D) / Δt)
M = min(L, N)
Temps demandés pour les lignes conservées : 0, Δt, …, (M - 1) × Δt
```

Cette formule décrit la programmation du code ; l’instant effectif des suspensions dépend du moteur Web Audio. Avec les valeurs initiales (`L = 20`, `Δt = 0,5 s`), le poster utilise les tranches demandées de 0 à 9,5 secondes, même pour un morceau de plusieurs minutes. L’analyse complète reste pourtant effectuée.

La fraction finale de seconde est exclue de la programmation. Un fichier de moins d’une seconde ne produit aucune ligne ; le générateur peut tout de même être considéré comme terminé par l’interface.

### Correspondance fréquentielle actuelle

Le code produit actuellement :

```text
B = frequencyBinCount = fftSize / 2
fréquence déclarée du bin i = i × sampleRate / B
```

La correspondance d’une FFT est `i × sampleRate / fftSize`. Les fréquences déclarées sont donc multipliées par deux. Exemple : pour un buffer à 44 100 Hz et une FFT de 2 048 points, le bin 100 représente environ 2 153 Hz, mais est étiqueté environ 4 307 Hz par le code.

Conséquence : le filtre initial affiché « 1 500–4 500 Hz » sélectionne en réalité des bins correspondant approximativement à 750–2 250 Hz. Les noms de notes sur l’axe sont décalés eux aussi. Ce défaut est déduit de la formule du code ; aucune mesure sur un signal étalon n’a été exécutée pendant cet audit.

## Des séries au dessin

Le [composant de rendu](../../app/renderer/PosterComponent.tsx) dessine dans un `<canvas>` depuis un effet React.

- Il remplit le fond, puis filtre l’axe et les amplitudes entre `minFrequency` et `maxFrequency` incluses.
- Il utilise une échelle fréquentielle linéaire et une marge fixe de 50 pixels.
- Les noms de notes naturelles de la table `NOTES` sont placés sur l’axe horizontal ; les notes diésées/bémolisées sont ignorées.
- Les lignes sont espacées en fonction de leur index, avec une normalisation verticale calculée sur `index + amplitude / 255`.
- Chaque courbe est interpolée avec des segments de Bézier. Son relief utilise une hauteur fixe de 50 pixels ; le fond masque une partie des courbes précédentes pour créer un effet de strates.
- Les étiquettes verticales affichent `index × durationBetweenLines` avec une décimale.

La palette configurée ne contrôle pas toute la courbe : après le premier segment de chaque ligne, les couleurs suivantes sont recalculées en HSL avec `index × 4`. Les couleurs choisies et les aperçus des presets peuvent donc différer du rendu réel.

Les marges, la police de 15 pixels et les reliefs de 50 pixels ne dépendent pas du DPI. Augmenter la taille du canevas ne préserve donc pas automatiquement les proportions graphiques du poster.

Le rendu n’a pas de branche dédiée aux séries vides, à une plage sans bin, à une seule fréquence ou à une amplitude uniforme avec une seule ligne. Certaines de ces entrées peuvent conduire à des divisions par zéro ou à des coordonnées non finies. Les cas exacts restent à vérifier dans un navigateur.

## Dimensions du canevas

Les calculs sont répartis entre [Welcome](../../app/welcome/welcome.tsx), [FormatPanel](../../app/welcome/FormatPanel.tsx) et les [constantes](../../app/welcome/welcome.constants.ts).

| Format       | Taille de base                 | Taille du canevas en portrait                  |
| ------------ | ------------------------------ | ---------------------------------------------- |
| A4           | 210 × 297 mm                   | 840 × 1 188 px.                                |
| A3           | 297 × 420 mm                   | 1 188 × 1 680 px.                              |
| Personnalisé | Largeur/hauteur internes en mm | `round(mm / 25,4 × DPI)` sur chaque dimension. |

Les formats standards utilisent **4 pixels par millimètre**, soit une densité calculée de 101,6 pixels par pouce. Le DPI initial de 300 ne s’applique qu’au mode personnalisé. À titre de comparaison, 210 × 297 mm à 300 DPI donne 2 480 × 3 508 pixels.

Le mode paysage échange largeur et hauteur de base, y compris pour les dimensions personnalisées. Il ne trie pas les valeurs pour garantir que la largeur soit supérieure à la hauteur.

La saisie en cm est convertie en mm ; la saisie en px est convertie en mm à l’aide du DPI courant. Changer ensuite le DPI conserve les millimètres internes et modifie le nombre de pixels. Les dimensions et le DPI sont bornés au calcul ; les champs sont aussi normalisés à la perte du focus.

## Export

`handleSavePoster` récupère le canevas `poster-preview-canvas`, appelle `toDataURL("image/png")` et déclenche le clic d’un lien de téléchargement.

```text
<nom-du-fichier-sans-extension>-<largeurMm>x<hauteurMm>mm.png
```

Le PNG contient uniquement le dessin, sans les panneaux ni la barre d’outils. Il utilise exactement les dimensions du canevas de prévisualisation. Aucun rendu d’export distinct, aucune insertion explicite de métadonnées DPI, aucun PDF ni SVG ne sont implémentés. Les millimètres inscrits dans le nom ne suffisent pas à imposer une taille d’impression au logiciel qui ouvrira le fichier.
