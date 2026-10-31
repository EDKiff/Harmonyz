# 003 — Mode animé musical

## Objectif et statut

**Première version implémentée le 31 octobre 2026 — recette automatisée et limites consignées dans la [validation](validation/README.md).**

Ajouter un mode permettant d’animer la représentation d’une musique pendant son écoute et de télécharger une animation en boucle au format GIF. L’utilisateur décrit une image qui se génère lorsque la musique est lancée et une boucle infinie, évoquée comme un « gif infini ».

La demande d’implémentation a engagé la réalisation des décisions ci-dessous. Ce document conserve le périmètre fonctionnel validé ; les [spécifications](../../specification/README.md) décrivent le comportement livré. La recette sur des téléphones physiques et plusieurs moteurs de navigateur reste à poursuivre.

## Existant concerné

Le parcours livré s’appuie sur :

- [Welcome](../../../app/welcome/welcome.tsx) et [useSongPlayback](../../../app/welcome/useSongPlayback.ts) pour le lecteur en boucle, Play/Stop, la navigation et les exports.
- [AudioAnalyzer](../../../app/renderer/AudioAnalyzer.ts) pour les spectres et la durée exacte du morceau entier, sans lecture audible pendant l’analyse.
- [animationFrame](../../../app/renderer/animation.ts) et [drawPoster](../../../app/renderer/PosterRenderer.ts) pour les mêmes courbes dans l’aperçu animé et le GIF, avec Spectrum et Joy Division.
- [GifPreparation](../../../app/animation/GifPreparation.ts) et son [worker](../../../app/animation/gif.worker.ts) pour préparer les images pendant l’écoute, les stocker encodées dans IndexedDB, puis compléter l’export indépendamment de l’éditeur.

Spécifications liées : [parcours actuel](../../specification/01-existant-fonctionnel.md), [analyse et rendu](../../specification/03-analyse-audio-et-rendu.md), [paramètres et presets](../../specification/04-parametres.md). Cette feature complète l’[objectif de création de poster musical — feature 001](../001-creation-de-poster/README.md) et s’applique aux styles existants, dont Joy Division introduit par la [feature 002](../002-style-joy-division/README.md).

## Exigences exprimées

- Ajouter un mode supplémentaire.
- Garder la création de posters fixes comme comportement par défaut.
- Permettre une représentation animée de la musique, avec une intention de répétition infinie.
- Permettre l’écoute dans Harmonyz avec une animation synchronisée et le téléchargement d’un GIF animé.

## Décisions validées

**Deux résultats sont attendus : une visualisation animée pendant l’écoute et un export GIF.** L’export GIF est muet ; le son accompagne la visualisation dans Harmonyz.

### Modes, styles et appareils

L’application affiche un poster fixe par défaut.

**Appareils ciblés validés : ordinateur et téléphone dès la première version.** Le parcours du mode animé, ses réglages, le lecteur et l’export GIF doivent être utilisables sur les deux catégories d’appareils. La cible mobile conserve les exigences du GIF : morceau entier, dimensions du poster et cadence de 20 images/s. L’accès aux commandes et la lisibilité sur petit écran font partie de la validation ; la compatibilité et les performances restent à vérifier sur des navigateurs et appareils représentatifs.

**Styles concernés : tous.** L’utilisateur a confirmé que le mode animé doit être disponible pour tous les styles, soit Spectrum et Joy Division dans l’existant. Le choix du mode de représentation (fixe ou animé) est indépendant du choix du style de dessin. L’écoute animée et l’export GIF doivent être accessibles avec chacun des deux styles.

**Personnalisation partagée entre les modes pour un même style.** Passer de fixe à animé conserve les réglages du style sélectionné. Modifier ces réglages dans l’un des modes les modifie aussi dans l’autre : couleurs, épaisseur, nombre de lignes et autres paramètres d’apparence et d’analyse communs aux deux modes. Les réglages propres à Spectrum restent distincts de ceux de Joy Division, selon la séparation existante entre styles. Le fichier et le format conservent leur portée commune. Le mouvement reprend l’intervalle entre les lignes ; les cadences de l’aperçu et du GIF sont fixées pour la première version, selon les décisions ci-dessous.

### Lecture et commandes

**Écoute en boucle validée : musique et animation recommencent automatiquement ensemble.** Dans Harmonyz, à la fin du morceau, la lecture reprend au début avec sa visualisation synchronisée. La boucle pendant l’écoute complète la répétition infinie du GIF exporté.

**Commande principale validée : un bouton Play/Stop au-dessus des panneaux Format et Personnalisation.** Play lance la musique et l’animation, puis le bouton devient Stop pendant la lecture. Stop revient au poster fixe et conserve la position de lecture ; le prochain Play reprend au même passage. Cette commande pilote le passage entre fixe et animé depuis la zone des boutons située au-dessus des panneaux.

**Choix d’export validé : un menu PNG / GIF sur le bouton Télécharger.** Le bouton de téléchargement ouvre un menu proposant les deux formats. Le choix GIF est disponible même lorsque la musique n’a jamais été lancée ; le PNG du parcours de poster fixe reste accessible. Ce menu conserve une seule commande de téléchargement dans la barre supérieure, sur ordinateur et téléphone.

**Navigation, temps et volume retenus pour le lecteur.** Le lecteur complet déjà validé conserve une barre permettant de se déplacer dans le morceau, le temps écoulé, la durée totale et un réglage de volume. Le bouton Play/Stop est la commande de lecture de la barre supérieure. La visualisation suit la position choisie dans le morceau afin de permettre l’examen d’un passage précis pendant la personnalisation. La disposition des contrôles complémentaires doit respecter leur accès sur ordinateur et téléphone.

**Personnalisation pendant l’écoute validée : la musique continue.** Modifier les couleurs, le style ou les réglages audio ne met pas automatiquement la musique en pause. Dès que le nouveau visuel est prêt, il est affiché en synchronisation avec la position de lecture alors courante. Un recalcul ne remet pas le morceau au début.

**Changement de morceau validé : l’export précédent continue.** Charger un nouveau fichier arrête l’écoute précédente et prépare le nouveau morceau en pause au début. Un GIF déjà en cours de génération continue jusqu’à son terme avec l’ancien morceau et les réglages conservés à son lancement. Il reste indépendant du fichier et du visuel désormais affichés dans l’éditeur.

### Export progressif et cadence

**Le bouton Exporter conserve l’état et la position du lecteur.** Si la musique est en pause, elle reste en pause ; si elle est en cours de lecture, elle continue depuis sa position actuelle. La génération progressive complète les images nécessaires au GIF sans relancer la musique ni déplacer la position d’écoute. L’export peut donc avancer aussi lorsque la musique n’a pas été lancée ou est en pause.

**Couverture de l’export validée : le morceau entier.** Le GIF parcourt toute la musique dans l’ordre chronologique, du début à la fin, avant de recommencer. L’utilisateur a préféré cette couverture à un extrait choisi ou automatique.

**Dimensions de l’export validées : celles du poster sélectionné.** Le GIF reprend la largeur et la hauteur en pixels correspondant au format et à l’orientation choisis dans l’éditeur.

**Cadence validée pour la première version : 20 images/s pour le GIF et l’aperçu pendant l’écoute.** Le GIF conserve le morceau entier à vitesse normale et les dimensions du poster. L’aperçu vise la même cadence pour permettre de juger la fluidité du futur export pendant la personnalisation. L’utilisateur retient ce choix pour l’instant ; une évolution pourra être discutée après la recette. La cadence effective, la fluidité et les performances doivent être vérifiées sur les appareils ciblés ; aucune mesure ni validation visuelle n’a encore été réalisée.

**Génération progressive pendant l’écoute et export sans écoute préalable.** L’utilisateur souhaite que le GIF se construise au fur et à mesure de la lecture. Il précise que le bouton Exporter doit également permettre de le produire lorsque la musique n’a pas encore été écoutée. Ces deux déclencheurs sont complémentaires : l’écoute alimente la préparation de l’export ; la commande Exporter doit produire le morceau entier, y compris les passages non lus. Une écoute complète préalable n’est donc pas une condition d’accès au GIF.

**Personnalisation uniforme du GIF validée : les réglages présents au lancement de l’export s’appliquent au morceau entier.** Si l’utilisateur écoute le début avec des courbes blanches, puis les passe en rouge avant d’exporter, toutes les courbes du GIF sont rouges. Les changements effectués pendant l’écoute servent à personnaliser le résultat final. Les éléments déjà préparés peuvent être réutilisés s’ils correspondent aux réglages de l’export ; les images devenues obsolètes doivent être régénérées progressivement.

**Export non bloquant validé : progression et bouton Annuler visibles.** Pendant la génération du GIF, l’éditeur reste utilisable pour écouter le morceau, naviguer et personnaliser le visuel. Ces modifications n’altèrent pas les réglages du GIF en cours, qui reste associé à ceux présents au lancement de son export. L’utilisateur peut suivre la progression et annuler la génération ; l’annulation concerne l’export et conserve les réglages ainsi que l’état du lecteur.

La gestion des images brutes et du fichier encodé fait partie des [travaux techniques restants](#travaux-techniques-restants). La préparation progressive et la disponibilité du fichier complet doivent être distinguées.

### Mouvement et raccord de boucle

**Mouvement retenu : défilement avec déformation progressive des courbes sur des rangées fixes.** Chaque rangée conserve sa hauteur dans le dessin. Sa courbe se transforme progressivement pour prendre la forme de celle de la rangée du dessous ; de nouvelles formes arrivent en bas et les plus anciennes quittent le haut de l’empilement. L’utilisateur a confirmé ce mouvement après clarification de l’impression de déformation recherchée.

**Empilement initial validé : complet dès le démarrage.** Le dessin présente immédiatement l’empilement de courbes : les dernières courbes du morceau occupent le haut et les premières le bas. Les formes de fin nécessaires sont préparées avant le démarrage de l’animation pour permettre un raccord continu avec son état initial. La production des images du GIF reste progressive.

**Transition fluide validée : les courbes passent par des formes intermédiaires entre deux états successifs.**

**Vitesse du mouvement validée : réutiliser l’intervalle entre les lignes.** Le réglage existant `durationBetweenLines` détermine à la fois l’espacement temporel des prélèvements audio et la durée de transformation d’une courbe vers celle du dessous. Par exemple, entre deux prélèvements espacés de 0,5 seconde, la transformation dure une demi-seconde. La musique reste à sa vitesse normale. Ce choix conserve un seul réglage pour relier l’analyse au mouvement ; il se distingue de la cadence des images, fixée à 20 images/s pour le GIF et visée à la même valeur pour l’aperçu.

**Repères temporels de Spectrum validés : des temps relatifs fixes en mode animé.** La courbe du bas correspond à `0 s`, puis les rangées au-dessus à `−Δt`, `−2Δt`, etc., avec `Δt` égal à l’intervalle entre les lignes. Par exemple, avec 0,5 seconde d’intervalle, les repères depuis le bas sont `0 s`, `−0,5 s`, `−1 s`, etc. Ils expriment le décalage par rapport à la position de lecture, tandis que le lecteur affiche le temps écoulé dans le morceau. Les repères de notes en bas restent présents ; Joy Division conserve son rendu sans axes. Cette décision concerne l’aperçu animé et le GIF, pas les repères du poster fixe existant.

**Raccord visuel validé : une transformation continue entre la fin et le début de la boucle.** Les courbes rejoignent progressivement les formes du début, y compris lorsque les passages de fin et de début diffèrent fortement. Le GIF doit ainsi conserver une impression de déformation continue au moment de recommencer. La méthode permettant ce raccord tout en conservant la couverture du morceau entier reste à définir. L’objectif de raccord fluide porte sur le visuel ; la musique reprend au début selon le choix d’écoute en boucle.

Les termes clarifiés sont regroupés dans le [glossaire de la feature](glossaire.md).

## Critères d’acceptation

- À l’ouverture de l’application, le mode poster fixe est sélectionné.
- Le parcours du mode animé, le lecteur, les réglages et l’export GIF sont utilisables sur ordinateur et téléphone dès la première version, avec des commandes accessibles sur petit écran.
- Le mode animé fait l’objet d’un choix explicite de l’utilisateur.
- Spectrum et Joy Division sont chacun utilisables en mode fixe ou animé ; chaque style permet l’écoute animée et l’export GIF.
- Pour un même style, passer de fixe à animé conserve la personnalisation ; une modification de ses réglages communs en animé est retrouvée au retour en fixe, et réciproquement. Les personnalisations des autres styles sont conservées séparément.
- Dans le mode animé, l’utilisateur peut lancer l’écoute du morceau et voir une représentation qui évolue avec le son.
- Pour la première version, l’aperçu pendant l’écoute vise une cadence de 20 images/s, comme le GIF. La cadence effective et la fluidité sont à vérifier sur ordinateur et téléphone.
- Au-dessus des panneaux Format et Personnalisation, Play lance la musique et l’animation puis devient Stop. Stop revient au poster fixe en conservant la position ; le prochain Play reprend au même passage.
- Le bouton Télécharger ouvre un menu PNG / GIF ; le GIF est sélectionnable et peut être produit même sans avoir lancé la musique. L’export PNG du poster fixe reste accessible.
- Le lecteur conserve une barre de navigation, le temps écoulé, la durée totale et le volume. Déplacer la position de lecture affiche le visuel correspondant au passage choisi.
- Modifier les couleurs, le style ou les réglages audio pendant l’écoute laisse la musique continuer. Le nouveau visuel rejoint la position courante dès qu’il est prêt, sans remise au début du morceau.
- Charger un autre morceau arrête l’écoute précédente et prépare le nouveau fichier en pause au début. Un export en cours continue avec l’ancien morceau et ses réglages de lancement ; le GIF livré correspond à cet ancien morceau.
- Repasser en mode poster fixe pendant l’écoute met la musique en pause et conserve sa position pour une reprise ultérieure en animé. Un export explicitement lancé continue de pouvoir avancer pendant cette pause.
- À la fin de l’écoute du morceau dans Harmonyz, la musique et l’animation recommencent automatiquement ensemble en restant synchronisées.
- Le visuel se renouvelle par défilement des courbes, avec une impression de déformation des lignes lorsqu’elles prennent la place de leurs voisines.
- Dès le démarrage de l’animation, l’empilement est complet, avec des courbes de fin du morceau au-dessus des courbes de début. La préparation de ces formes initiales conserve le principe de génération progressive du GIF.
- Les rangées conservent des hauteurs fixes ; chaque courbe prend progressivement la forme de celle du dessous, avec des formes intermédiaires qui rendent la transition fluide.
- L’intervalle entre les lignes pilote aussi la durée de transformation entre les courbes : pour deux prélèvements espacés de 0,5 seconde, la transition dure 0,5 seconde, avec une lecture audio à vitesse normale.
- En mode animé, Spectrum affiche des repères temporels relatifs fixes : `0 s` en bas, puis `−Δt`, `−2Δt`, etc. Les notes restent en bas et les repères du GIF suivent la même règle ; Joy Division reste sans axes.
- L’utilisateur peut télécharger un fichier GIF animé, sans son, configuré pour une répétition infinie.
- Le GIF représente le morceau entier, du début à la fin dans l’ordre chronologique, avant chaque répétition.
- Le GIF reprend les dimensions en pixels du poster sélectionné, en conservant son orientation.
- Le GIF utilise une cadence nominale de 20 images/s et représente le morceau à vitesse normale ; la gestion de sa dernière fraction de seconde doit conserver la durée à la précision temporelle permise par le format GIF.
- Le GIF se construit progressivement pendant l’écoute.
- Le bouton Exporter permet de produire le GIF complet même sans écoute préalable. Après une écoute partielle ou une navigation dans le morceau, le GIF exporté représente aussi tous les passages non lus, dans l’ordre chronologique.
- Cliquer sur Exporter conserve l’état et la position du lecteur : une musique en pause reste en pause et une musique en lecture continue depuis sa position actuelle, pendant que la génération progressive complète le GIF.
- Les réglages présents au lancement de l’export s’appliquent au GIF entier. Après une écoute en blanc puis un changement vers le rouge avant l’export, le GIF est entièrement rouge ; les préparations obsolètes sont régénérées progressivement.
- Pendant la génération, l’éditeur reste utilisable et une progression ainsi qu’un bouton Annuler sont visibles. Modifier les réglages à ce moment ne change pas le GIF en cours d’export ; annuler l’export conserve les réglages et l’état du lecteur.
- Au raccord entre la fin et le début du GIF, les courbes se transforment progressivement pour conserver la continuité visuelle de l’animation.

Ces critères restent la référence d’acceptation. La [recette](validation/README.md) distingue les contrôles exécutés, leurs résultats et les vérifications qui restent à effectuer sur des appareils physiques.

## Préparation du cadrage de l’export

Les [notes sur l’export GIF](cadrage-export-gif.md) regroupent les choix validés de dimensions, de cadence et de génération progressive, les contraintes vérifiées du format et des calculs théoriques de volume d’images. Ces notes historiques précèdent l’implémentation ; les [résultats de validation](validation/README.md) consignent les exports et mesures effectivement réalisés. Les calculs préparatoires utilisent la cadence retenue de 20 images/s et une durée illustrative de quatre minutes.

## Choix livrés et limites restantes

La première version réalise le périmètre ci-dessus. L’[architecture livrée](../../specification/02-architecture.md), le [calcul du mouvement, le raccord et les exports](../../specification/03-analyse-audio-et-rendu.md) et les [limites actuelles](../../specification/05-limites-actuelles.md) sont décrits dans les spécifications de référence.

Les vérifications restantes concernent la compatibilité de plusieurs navigateurs et téléphones physiques, la fluidité sur ces appareils, ainsi que les mesures sur des morceaux longs aux dimensions du poster. La cadence de l’aperçu vise 20 images/s ; le débit d’encodage dépend de l’appareil et de la résolution. L’espace nécessaire au GIF encodé dépend de sa durée et de son contenu ; une erreur de quota IndexedDB reste possible. Une fermeture forcée du navigateur peut laisser une base temporaire que le nettoyage normal de fin de session n’a pas pu supprimer.

La [validation](validation/README.md) conserve les commandes de reproduction et les limites de la campagne effectuée. Le [glossaire](glossaire.md) définit les termes fonctionnels ; les [notes d’export](cadrage-export-gif.md) conservent les calculs du cadrage initial.

[Retour aux fonctionnalités](../README.md).
