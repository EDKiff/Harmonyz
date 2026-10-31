# Recette du mode animé musical

Vérifications locales réalisées le **31 octobre 2026**, pendant le développement de la [feature 003](../README.md). Les résultats ci-dessous concernent Chromium automatisé sur l'environnement de développement, avec une fenêtre de 1 440 × 1 000 px et un écran de téléphone simulé de 390 × 844 px.

## Vérifications reproductibles

Les tests de comportement du moteur se lancent avec `npm test`. Ils contrôlent l'empilement initial, les formes intermédiaires, les repères relatifs et les rangées fixes des deux styles, la continuité de boucle avec une durée non multiple de l'intervalle, les morceaux courts silencieux, le respect des couleurs et la durée GIF à la précision du centième de seconde. Ils utilisent le lanceur de tests de Node et le compilateur TypeScript déjà présent dans le projet.

Le [script navigateur](verification.cjs) génère ses fichiers audio de test en mémoire et vérifie le lecteur et les téléchargements. Il accepte également `song.mp3` à la racine pour le contrôle d'import et de lecture d'un MP3 réel. Playwright est utilisé depuis une installation externe au dépôt :

```bash
npm run dev -- --host 127.0.0.1 --port 3181
HARMONYZ_URL=http://127.0.0.1:3181 PLAYWRIGHT_MODULE=/chemin/vers/playwright node doc/feature/003-mode-anime-musical/validation/verification.cjs
```

`PLAYWRIGHT_MODULE` peut être omis lorsque Playwright est directement accessible à Node. L'environnement de recette utilisait des bibliothèques système Chromium extraites dans un dossier temporaire, ajoutées à `LD_LIBRARY_PATH`. `HARMONYZ_KEEP_ARTIFACTS=1` conserve les GIF et les captures dans le dossier temporaire affiché à la fin. Un serveur de développement doit avoir terminé l'optimisation de ses dépendances pour éviter qu'un rechargement Vite interrompe la recette.

## Résultats fonctionnels

| Scénario                                               | Résultat observé                                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture sans fichier                                 | Play et Save désactivés ; absence de lecture automatique.                                                                                                                                   |
| Export Spectrum avant toute écoute                     | GIF complet téléchargé ; lecteur toujours en pause à zéro.                                                                                                                                  |
| Play, Stop et reprise                                  | Son lancé, Stop conserve la position ; Play reprend au même passage.                                                                                                                        |
| Navigation et volume                                   | Le curseur déplace la lecture ; le volume de l'élément audio suit le réglage.                                                                                                               |
| Changement de style et de couleurs pendant l'écoute    | La musique continue ; les réglages restent disponibles.                                                                                                                                     |
| Fin du morceau                                         | La lecture revient automatiquement au début.                                                                                                                                                |
| Audio de 0,501 s avec intervalle de 0,5 s              | Analyse terminée et GIF exporté ; absence du blocage lié au dernier quantum Web Audio rencontré pendant le développement.                                                                   |
| Réglages modifiés et nouveau fichier pendant un export | Le GIF conserve la durée, le nom et les couleurs rouges de l'ancien morceau ; le nouveau fichier est en pause au début.                                                                     |
| Annulation d'un export pendant l'écoute                | L'écoute continue ; l'annulation ne change pas le lecteur.                                                                                                                                  |
| Téléphone simulé                                       | Play, Save, navigation et volume dans l'écran ; menu GIF accessible. Un export après écoute partielle et déplacement couvre aussi les passages non lus et conserve la pause et la position. |

L'import du MP3 réel `song.mp3` a également terminé son analyse : la lecture a démarré, puis Stop a conservé sa position. Une capture du poster A4 sur ordinateur est conservée avec les autres artefacts lorsque `HARMONYZ_KEEP_ARTIFACTS=1`.

Le téléchargement PNG depuis le menu pendant l'écoute a été comparé octet par octet au PNG du poster fixe capturé avant Play : les deux fichiers sont identiques. L'export conserve la lecture et sa position ; le PNG reste donc celui du parcours fixe même pendant la visualisation animée.

Le script inspecte les dimensions, les délais de **toutes les images**, les palettes et l'extension de répétition infinie du fichier GIF avec un parseur indépendant de l'encodeur. `ImageDecoder` de Chromium décode ensuite sa première et sa dernière image. Les palettes du GIF rouge ne contiennent aucune couleur issue des modifications bleues effectuées après son lancement. Aucun événement `pageerror` n'a été relevé lors de la recette complète.

## Contrôles du dépôt

Lors de la première livraison, la suite complète `npm test` a réussi avec **12 tests**. Le contrôle complémentaire Play/Stop ci-dessous ajoute les régressions de géométrie. `npm run typecheck`, `npm run lint` et `npm run build` ont également réussi ; le build client inclut le worker GIF et le build serveur conserve le rendu SSR. Les liens locaux du README racine et de `doc/` ont été contrôlés sans cible manquante. La CI exécute désormais la suite Node avant le build.

La revue du changement depuis `ed0cdf1ecb34744c33d09748937566dae8fdd621` a couvert séparément les règles du projet et les exigences de la feature. Un écart mineur de séparation documentaire a été corrigé ; aucun écart fonctionnel n’a été identifié. L’extraction future de la gestion des exports hors de Welcome reste une suggestion de maintenance.

## Mesures locales

| Export                                           | Dimensions     | Images | Durée GIF | Taille du fichier | Temps local de génération et téléchargement |
| ------------------------------------------------ | -------------- | ------ | --------- | ----------------- | ------------------------------------------- |
| Spectrum sans écoute préalable, audio de 2,127 s | 240 × 320 px   | 43     | 2,13 s    | 341 227 octets    | Environ 0,4–0,5 s.                          |
| Joy Division, audio de 0,501 s                   | 840 × 1 188 px | 10     | 0,50 s    | 89 276 octets     | Environ 0,4–0,5 s.                          |
| Joy Division, export isolé de l'ancien morceau   | 240 × 320 px   | 163    | 8,13 s    | 1 340 921 octets  | Non chronométré séparément.                 |
| Téléphone simulé, après écoute partielle         | 240 × 320 px   | 13     | 0,63 s    | 96 116 octets     | Non chronométré séparément.                 |

La cadence de l'aperçu Spectrum a été mesurée entre **19,5 et 20 images/s** sur des fenêtres de 1,5 seconde, en comptant les opérations de redessin du canevas. Les GIF utilisent des délais de 5 centièmes de seconde, avec adaptation de la dernière image : par exemple 42 délais de 5 centièmes puis un délai de 3 centièmes pour l'audio de 2,127 s.

Ces mesures comprennent l'orchestration locale du téléchargement et l'inspection du résultat ; elles ne constituent pas un benchmark multi-appareils. La mémoire totale, les longues durées aux grands formats, la fluidité sur un téléphone physique et Safari/Firefox n'ont pas été mesurés. Le traitement successif des images et le stockage temporaire des blocs encodés dans IndexedDB sont constatés dans le code ; aucune mesure de mémoire globale du processus navigateur n'est présentée.

## Contrôle du build de production

Après le build client et serveur, la même recette complète a réussi contre le serveur de production local (`PORT=3182 npm start`). La page rendue par le serveur s'hydrate correctement et le worker GIF empaqueté fonctionne : les quatre GIF présentent les mêmes dimensions, nombres d'images, durées et tailles que pendant la recette de développement. Les scénarios de lecture, d'export isolé, d'annulation, de téléphone simulé et d'import du MP3 réel sont passés sans événement `pageerror`.

La recette de production a été enrichie du contrôle PNG pendant la lecture puis exécutée à nouveau avec succès. Pendant ces contrôles distincts, le premier GIF a été produit et inspecté en 382–433 ms, et le GIF A4 court en 438–467 ms. Le comptage des redessins sur des fenêtres de 1,5 seconde a donné 19,6–20,5 images/s ; cette courte observation inclut les redessins d'interface et ne constitue pas une mesure de cadence soutenue. Les captures et GIF sont conservables de la même façon que pour le serveur de développement.

## Comparaison visuelle avant et après Stop

Cette section conserve le contrôle historique du commit `65910d6`. Il vérifiait les rangées mais laissait le contenu changer à la pause et les pics supérieurs être coupés. Le [contrôle complémentaire](#pause-exacte-et-pics-entiers) ci-dessous remplace ces critères insuffisants ; les anciennes captures restent conservées pour expliquer le diagnostic. Le script historique utilise maintenant le retour explicite Still poster pour comparer la lecture avec le poster initial.

Après le signalement de décalages dans les deux styles, le [script de comparaison](stop-comparison.cjs) a été exécuté sur `song.mp3`, en A4 portrait (840 × 1 188 px), dans Chromium à 1 440 × 1 000 px. Il place la lecture vers 12 secondes, capture le canevas puis déclenche Stop dans la même tâche navigateur ; il prend ensuite une seconde capture une fois le poster fixe redessiné. Les commandes Canvas observées permettent de comparer chaque hauteur de rangée, tandis que les dimensions affichées et la position audio sont vérifiées séparément.

```bash
HARMONYZ_URL=http://127.0.0.1:3181 PLAYWRIGHT_MODULE=/chemin/vers/playwright HARMONYZ_CAPTURE_DIR=/tmp/harmonyz-stop node doc/feature/003-mode-anime-musical/validation/stop-comparison.cjs
```

Sans `HARMONYZ_CAPTURE_DIR`, le script crée un dossier temporaire et en affiche le chemin. Il conserve les deux captures de canevas et d’interface par style, un panneau comparatif et les mesures JSON. Sur un montage WSL où Vite ne reçoit pas les changements de fichiers, redémarrer le serveur avant la recette pour vérifier le code effectivement servi.

Le symptôme a été reproduit deux fois avant correction, avec le même verdict rouge. Les preuves initiales correspondent au commit `436b9fa` :

| Style        | Décalage maximal des rangées avant correction | Après correction | Comparaison initiale                                        | Comparaison corrigée                                       |
| ------------ | --------------------------------------------- | ---------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Spectrum     | 44,68 px                                      | 0 px             | [Avant correction](stop/before/spectrum-comparison.png)     | [Après correction](stop/after/spectrum-comparison.png)     |
| Joy Division | 152,88 px                                     | 0 px             | [Avant correction](stop/before/joy-division-comparison.png) | [Après correction](stop/after/joy-division-comparison.png) |

Les [mesures initiales](stop/before/results.json) et les [mesures corrigées](stop/after/results.json) conservent les positions exactes. Dans les deux styles, le canevas reste de la même taille et à la même position ; Stop conserve également la position audio et ne produit aucune erreur navigateur. Les notes Spectrum gardent leurs coordonnées. Le correctif aligne aussi leurs positions sur les bins fréquentiels, vérifié avec des fréquences connues dans le test du renderer.

La comparaison corrigée montre une occupation commune de la zone de dessin : l’empilement Joy Division n’est plus tassé sous une réserve de pic entière, et les rangées Spectrum ne remontent plus à l’arrêt. Les courbes peuvent changer de forme puisque Stop retrouve les premières tranches du poster fixe ; ce retour est conservé. Les pics qui quittent le haut de Joy Division sont découpés à la limite de sa zone utile sans déplacer l’empilement.

La boucle minimale `node --test tests/poster-renderer.test.cjs` a d’abord montré les différences entre deux dessins des mêmes courbes, puis les a éliminées : **8 tests ciblés réussissent**, dont cinq nouvelles régressions sur les positions et l’échelle entre modes, les fichiers courts et l’alignement des notes. Le faux contexte Canvas utilisé par ces tests observe les coordonnées mais ne simule pas les pixels du découpage ; les captures réelles complètent donc ce contrôle.

La campagne comparative a également réussi sur le build de production (`PORT=3182 npm start`). Pour chaque style, le PNG téléchargé après Stop est identique octet par octet au canevas fixe capturé ; le résultat `pngMatchesFixedPreview` figure dans les mesures corrigées. La suite complète passe désormais avec **17 tests**, ainsi que TypeScript, Prettier et le build client/serveur. Les revues Standards et Spec du correctif n’ont identifié aucun écart.

La recette générale a été rejouée sur ce build de production : lecture, reprise, navigation, boucle, PNG pendant l’écoute, export GIF avant écoute, personnalisation uniforme, changement de morceau pendant export, annulation et téléphone simulé passent sans erreur navigateur. Après la modification du dessin, les tailles de GIF ont changé : 340 354 octets pour Spectrum de 2,127 s, 93 474 octets pour Joy Division A4 de 0,501 s, 1 339 488 octets pour l’export isolé de 8,127 s et 96 807 octets pour l’export après écoute partielle. Les dimensions, nombres d’images, durées et boucles restent conformes aux contrôles précédents.

## Pause exacte et pics entiers

Après les captures fournies par l’utilisateur, la commande Play/Stop a été remplacée par Play/Pause : Pause conserve exactement le dernier dessin affiché, y compris les repères relatifs de Spectrum. Le retour au poster initial est désormais explicite via Still poster. Le [script de pause](pause-comparison.cjs) observe l’image entière à 12 et 60 secondes de `song.mp3`, pour les deux styles. Il capture l’image et clique sur la commande dans la même tâche JavaScript ; les callbacks rAF sont suspendus à cet instant pour empêcher une image supplémentaire de fausser la comparaison, tandis que le temps audio continue normalement jusqu’au clic.

```bash
HARMONYZ_URL=http://127.0.0.1:3181 PLAYWRIGHT_MODULE=/chemin/vers/playwright HARMONYZ_CAPTURE_DIR=/tmp/harmonyz-pause node doc/feature/003-mode-anime-musical/validation/pause-comparison.cjs
```

Avant correction, ce test échouait avec plus de cent mille pixels différents par style et par pause, malgré la stabilité des rangées. Il observait également deux points Joy Division au-dessus de la découpe supérieure à 12 secondes. La régression minimale `node --test --test-name-pattern='loudest upper' tests/poster-renderer.test.cjs` échouait avec un pic à **−89,444 px** sur un canevas A4. Les [résultats avant correction](pause/before/results.json) correspondent au commit `65910d6`.

| Style        | Pixels différents à 12 s avant correction | Pixels différents après correction, à 12 et 60 s | Avant correction                                                 | Après correction                                                         |
| ------------ | ----------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Spectrum     | 108 039                                   | 0                                                | [Comparaison initiale](pause/before/spectrum-comparison.png)     | [Image conservée](pause/after/spectrum-comparison.png)                   |
| Joy Division | 234 850                                   | 0                                                | [Comparaison initiale](pause/before/joy-division-comparison.png) | [Image conservée, pics entiers](pause/after/joy-division-comparison.png) |

Les [résultats corrigés](pause/after/results.json) comprennent les empreintes SHA-256 des PNG avant/après, le nombre exact de pixels modifiés et la position audio. Les quatre pauses conservent des images identiques. Les pics observés restent à l’intérieur du canevas et aucune zone de découpe supérieure n’est appliquée. Les tests du renderer couvrent en plus le relief maximal sur A4 portrait, A4 paysage et petit format, ainsi qu’une séquence interpolée dont la réserve dépend des données du morceau entier.

La réserve supérieure Joy Division vient du relief maximal calculé sur le morceau, jamais de l’image courante ; les rangées ne changent donc pas de cadrage au fil de l’écoute. Cette réserve laisse un espace au-dessus des passages calmes, nécessaire pour contenir aussi les pics plus hauts du même morceau sans les couper.

La campagne pixel par pixel a aussi réussi sur le build de production (`PORT=3182 npm start`), avec les mêmes quatre images strictement conservées et aucun pic coupé. La recette générale adaptée à Play/Pause a vérifié le retour explicite Still poster, la reprise, la navigation, le volume, la boucle, le PNG fixe pendant l’écoute et les GIF complets avant/après écoute. L’export isolé, le changement de morceau, l’annulation et les commandes sur téléphone simulé restent fonctionnels, sans erreur navigateur. Les 20 tests Node, TypeScript et le build client/serveur ont réussi. Cette campagne reste limitée à Chromium ; elle ne remplace pas une validation sur téléphones physiques et plusieurs moteurs.

[Retour à la feature 003](../README.md).
