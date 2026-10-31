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

La suite complète `npm test` a réussi avec **12 tests**. `npm run typecheck`, `npm run lint` et `npm run build` ont également réussi ; le build client inclut le worker GIF et le build serveur conserve le rendu SSR. Les liens locaux du README racine et de `doc/` ont été contrôlés sans cible manquante. La CI exécute désormais la suite Node avant le build.

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

[Retour à la feature 003](../README.md).
