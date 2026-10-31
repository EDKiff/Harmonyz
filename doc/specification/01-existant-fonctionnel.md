# 01 — Existant fonctionnel

## Produit présent dans le dépôt

Harmonyz expose une seule page, `/`, intitulée « Harmonyz », avec la description « Cool music posters ». L’interface est en anglais. Elle permet d’importer un MP3 local, de personnaliser un poster fixe, d’écouter le morceau avec une visualisation animée et de télécharger un PNG ou un GIF muet.

Deux styles sont sélectionnables : **Spectrum**, sélectionné au démarrage, et **Joy Division**. Chaque style conserve ses réglages d’apparence et d’analyse pendant la session ; fichier et format sont communs. Les modes fixe et animé utilisent les mêmes réglages du style sélectionné.

Le dessin est un empilement de courbes de spectre : horizontalement, les points représentent des bandes de fréquences ; les reliefs représentent leur intensité. Spectrum ajoute des repères de temps et de notes. Joy Division conserve un rendu sans axes. Ces mesures ne reposent sur aucun modèle d’IA, aucune recherche de pochette et aucune identification de titre ou d’artiste.

L’aperçu et les panneaux Format et Personnalisation sont côte à côte sur grand écran et empilés dans une page défilante sur petit écran. La barre supérieure conserve les commandes de lecture, d’import, d’affichage des panneaux et de téléchargement. Les panneaux sont ouverts au démarrage.

Sources : [route](../../app/routes/home.tsx), [éditeur](../../app/welcome/welcome.tsx), [rendu partagé](../../app/renderer/PosterRenderer.ts).

## Import et personnalisation

1. **Ouvrir la page.** « No poster yet » invite à charger une musique. Le poster fixe est le mode initial ; les réglages sont disponibles avant l’import.
2. **Cliquer sur Load.** Le sélecteur demande un MP3 avec `accept=".mp3,audio/mpeg"`. Ce filtre ne remplace pas une validation du contenu. Un seul fichier est utilisé.
3. **Choisir un morceau.** Le fichier reste dans le navigateur. La lecture précédente s’arrête ; le nouveau morceau est préparé en pause au début. Le nom et la taille apparaissent dans le panneau de personnalisation.
4. **Attendre l’analyse.** La génération démarre automatiquement. « Updating poster… You can keep listening. » signale les calculs sans bloquer l’éditeur.
5. **Personnaliser.** Drawing style choisit le style ; Advanced règle couleurs, épaisseur, lignes, fréquences et analyse audio ; Presets propose quatre ambiances. Modifier les réglages pendant l’écoute laisse la musique continuer. Dès que le calcul courant est terminé, le nouveau visuel rejoint la position de lecture courante.
6. **Choisir un format.** A4, A3 ou dimensions personnalisées en cm/px, avec orientation et DPI pour le format personnalisé. Une garde refuse l’aperçu et les exports au-delà de 4 096 px par côté ou de 16 millions de pixels, avant l’allocation du canevas.

Les modifications sont prises en compte après 250 ms sans nouvelle saisie. Le générateur réutilise une analyse en cache si les paramètres audio correspondent ; couleurs, format et nombre de lignes ne demandent alors aucun nouveau décodage. Le nom historique « throttle » correspond à une temporisation de type debounce. Le résultat précédent reste visible pendant un recalcul ; les téléchargements attendent que les réglages courants soient prêts.

Sources : [Welcome](../../app/welcome/welcome.tsx), [FormatPanel](../../app/welcome/FormatPanel.tsx), [PersonalizationPanel](../../app/welcome/PersonalizationPanel.tsx), [garde de dimensions](../../app/animation/gifTimeline.ts).

## Écoute animée

**Play**, au-dessus des panneaux, lance la musique et l’animation puis devient **Pause**. Pause conserve exactement la dernière image dessinée et la position audio. Le prochain Play reprend au même passage. **Still poster**, dans la barre du lecteur, revient explicitement au poster fixe initial et met le son en pause sans déplacer la position audio. À la fin du morceau, l’élément audio en boucle reprend au début et le visuel suit sa position.

Le lecteur affiche une barre de navigation, le temps écoulé, la durée totale et un réglage de volume. Déplacer le curseur affiche le passage choisi, y compris en pause, sans déclencher l’écoute. Cette inspection reste visible pendant la pause ; Still poster permet de revenir explicitement au poster fixe.

La position de l’élément audio sert d’horloge à l’aperçu, avec une cible de 20 images/s. Les rangées restent à des hauteurs fixes : leurs courbes prennent progressivement la forme de celles du dessous. L’empilement est complet dès la première image, en utilisant aussi les spectres de fin du morceau. L’intervalle entre les lignes règle la durée des transformations ; le dernier intervalle du morceau est interpolé vers son début pour assurer la continuité visuelle de la boucle.

En animé, Spectrum affiche `0 s` en bas puis des temps relatifs négatifs au-dessus, espacés de l’intervalle entre les lignes ; les notes restent en bas. Le poster fixe conserve ses étiquettes historiques. Joy Division reste sans axes dans les deux modes.

Sources : [lecteur](../../app/welcome/useSongPlayback.ts), [animation](../../app/renderer/animation.ts), [rendu](../../app/renderer/PosterRenderer.ts).

## Téléchargements

Le bouton de téléchargement **Save** ouvre **Download PNG** et **Download GIF**. Les deux sont disponibles après la préparation du poster, même si la musique n’a jamais été lancée.

- **PNG** : le dessin fixe est rendu séparément de l’aperçu animé, aux dimensions du poster. Télécharger pendant l’écoute conserve ainsi le poster fixe sans modifier le lecteur.
- **GIF** : le morceau entier est représenté à vitesse normale, sans son, avec une répétition infinie. La cadence nominale est de 20 images/s ; la durée totale est arrondie au centième de seconde permis par GIF et le dernier délai est ajusté en conséquence. Les dimensions et l’orientation sont celles du poster.

L’écoute prépare progressivement des images GIF encodées pour les réglages courants. Un export complète les images manquantes et les assemble chronologiquement, sans déplacer le lecteur ni changer son état. Les réglages et le morceau au lancement de l’export restent associés à tout le GIF, même si l’utilisateur change ensuite le style, les couleurs, les paramètres ou le fichier.

La progression et **Cancel export** restent visibles pendant la génération. L’éditeur, la navigation et l’écoute restent utilisables ; annuler conserve le lecteur et les réglages. Un seul export GIF est autorisé à la fois. Les données encodées temporaires sont stockées dans IndexedDB puis assemblées en Blob ; toutes les images RGBA ne sont pas conservées simultanément.

Les noms suivent `<nom-du-fichier>-<largeurMm>x<hauteurMm>mm.png` ou `.gif`. Les fichiers contiennent uniquement le dessin. Leurs noms ne constituent pas des métadonnées d’impression.

Sources : [commandes d’export](../../app/welcome/welcome.tsx), [préparation GIF](../../app/animation/GifPreparation.ts), [worker GIF](../../app/animation/gif.worker.ts), [téléchargement](../../app/welcome/downloadBlob.ts).

## Capacités et limites fonctionnelles

Le poster fixe utilise encore les premières tranches du morceau dans la limite du nombre de lignes ; l’animation et le GIF parcourent le morceau entier. Il n’existe pas de sélection d’extrait pour l’export.

Titre, artiste, texte libre, identification musicale, import depuis une plateforme, sauvegarde de projet, compte, partage et commande d’impression ne sont pas implémentés. Il n’existe ni manifeste ni service worker pour installer une PWA. Les réglages et le fichier d’édition disparaissent au rechargement ; le stockage GIF temporaire n’est pas une sauvegarde de projet.

La disposition responsive prévoit l’accès aux commandes sur petit écran. La compatibilité, la cadence réelle et les performances sur les morceaux longs ne se déduisent pas de cette disposition ; les vérifications exécutées et leurs limites sont consignées dans le [document 06](06-developpement-et-verification.md).

## Erreurs et confidentialité

Les erreurs d’analyse, de lecture, d’export et de dimensions sont affichées dans l’éditeur. **Try again** permet de relancer la préparation après une erreur d’analyse ou d’export ; le fichier peut aussi être remplacé. Une erreur d’analyse invalide le poster. GIF demande Web Workers, OffscreenCanvas et un stockage IndexedDB disponible ; un échec de stockage ou de quota produit un message d’erreur.

Le code applicatif ne transmet pas le fichier audio à un serveur et n’appelle aucune API musicale. L’analyse, la lecture, le dessin et l’encodage sont locaux au navigateur. La police Inter reste chargée depuis Google Fonts : le fonctionnement local de l’audio ne signifie pas une absence totale de requêtes réseau.

Sources : [gestion des erreurs](../../app/welcome/welcome.tsx), [lecture](../../app/welcome/useSongPlayback.ts), [worker](../../app/animation/gif.worker.ts), [polices](../../app/root.tsx).
