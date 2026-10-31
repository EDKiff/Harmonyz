# 002 — Deuxième style de poster inspiré de la référence Joy Division

## Objectif et statut

**Première version développée le 31 octobre 2026 — retours visuels utilisateur à poursuivre.**

L’utilisateur souhaite disposer de plusieurs possibilités de personnalisation, en commençant par une deuxième inspirée de l’image Joy Division / Unknown Pleasures jointe à la conversation. Le cadrage a été suivi d’une autorisation explicite de développement avec retours sur l’image fournie. Le premier rendu et l’intégration sont implémentés ; la fidélité visuelle reste à ajuster selon les retours utilisateur.

**Décision validée : ajouter un nouveau style de dessin distinct, sélectionnable à côté du rendu actuel.** Il ne s’agit pas simplement d’un preset supplémentaire. Le vocabulaire retenu est défini dans le [glossaire](glossaire.md).

## Priorité de la feature

**Priorité explicitement validée : reproduire le langage graphique de la référence Joy Division.** L’intégration à l’interface reste nécessaire, mais les détails secondaires de présentation ne sont pas le centre du cadrage. La réussite visuelle doit être examinée sur un poster réellement produit à partir d’un audio, pas uniquement sur la présence du sélecteur et des réglages.

## Existant concerné

Le code présente un seul rendu spectral et quatre presets partiels. Aucun sélecteur de modes de rendu distincts n’existe dans les sources examinées.

- [Paramètres et presets actuels](../../specification/04-parametres.md), vérifiés dans les [types](../../../app/welcome/welcome.types.ts) et les [constantes](../../../app/welcome/welcome.constants.ts).
- [Analyse audio et rendu actuels](../../specification/03-analyse-audio-et-rendu.md), vérifiés dans le [composant de rendu](../../../app/renderer/PosterComponent.tsx) et le [générateur](../../../app/renderer/PosterGenerator.ts).
- [Objectif produit général — feature 001](../001-creation-de-poster/README.md). Les propositions de cette feature ne sont pas automatiquement des prérequis validés pour la feature 002.

## Référence visuelle

La référence fournie représente un poster noir avec les mentions « JOY DIVISION » en haut et « UNKNOWN PLEASURES » en bas. De nombreuses lignes blanches horizontales serrées présentent des reliefs irréguliers concentrés au centre, avec des extrémités relativement plates et des occultations entre les courbes. Aucun axe ni repère chiffré n’apparaît.

**Décision validée : reprendre uniquement les courbes pour cette première version, sans titre ni artiste.** Les zones de texte de la référence ne font donc pas partie de la validation visuelle du rendu cible.

**Apparence initiale validée : courbes blanches sur fond noir, sans axes ni graduations, avec les reliefs concentrés au centre.** Le premier tracé est décrit dans la [spécification du rendu](../../specification/03-analyse-audio-et-rendu.md). Le noir et blanc est une valeur par défaut : l’utilisateur doit pouvoir personnaliser le résultat selon un fonctionnement similaire au système actuel.

L’image ajoutée par l’utilisateur est conservée dans ce dossier : [référence visuelle Joy Division](s-l1600.webp). Elle a été ouverte et examinée pendant le cadrage. Elle servira de support aux vérifications visuelles ; les éléments à comparer restent à décider.

## Comportement attendu et critères d’acceptation

Comportement validé : permettre de sélectionner le nouveau style de dessin inspiré de la référence, en plus du rendu actuel. Prévoir une validation par image.

**Sélection du style validée : un sélecteur en haut du panneau de personnalisation, au-dessus des onglets actuels « Advanced » et « Presets ».** Le rendu actuel et le nouveau style sont tous deux accessibles depuis ce sélecteur. Les réglages affichés correspondent au style choisi et retrouvent les valeurs conservées pour celui-ci. Les noms affichés des styles restent à définir.

Le nouveau style ne comporte ni titre ni artiste dans cette première version. L’ajout de texte sort du périmètre de la feature 002.

**Personnalisation validée : conserver une expérience similaire au panneau actuel.** Le nouveau style reste réglable par l’utilisateur ; son apparence de référence ne constitue pas un rendu figé. Les contrôles existants pertinents (couleurs, épaisseur, nombre de lignes, fréquences, analyse audio) constituent la base à reprendre. Les contrôles de couleur et de police des axes sont masqués pour le nouveau style ; les autres contrôles actuels restent accessibles. Les presets et les réglages avancés du système actuel sont décrits dans la [spécification des paramètres](../../specification/04-parametres.md).

**Presets validés : rendre les quatre presets actuels disponibles dans les deux styles.** Appliquer un preset modifie les réglages du seul style sélectionné, sans changer de style de dessin ni modifier les réglages conservés pour l’autre style. Les effets du preset restent mémorisés dans les réglages du style concerné pendant la session. Les presets restent des patches partiels selon le fonctionnement actuel ; leur application n’impose pas une réinitialisation générale. Les couleurs d’axes des presets sont ignorées par le nouveau style, qui ne dessine pas d’axes.

**Conservation des réglages validée : chaque style retrouve ses propres réglages pendant la session.** Après avoir personnalisé le style A, sélectionné et personnalisé le style B, puis sélectionné de nouveau A, l’utilisateur retrouve les réglages précédents de A ; un retour vers B restitue ceux de B. Changer de style ne réinitialise donc pas les personnalisations déjà effectuées. Ce choix n’ajoute pas de sauvegarde après rechargement de la page. La répartition validée est précisée ci-dessous.

**Répartition des paramètres validée :**

| Portée                 | Paramètres                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Communs aux styles     | Fichier audio ; format, orientation et dimensions du poster, unité et DPI lorsqu’ils s’appliquent.                                                                                              |
| Propres à chaque style | Apparence (couleurs, épaisseur, nombre de lignes, plage de fréquences et autres réglages visuels pertinents) ; analyse audio (FFT, lissage, bornes de décibels et intervalle entre les lignes). |

Changer de style conserve le morceau chargé et le format commun, puis restaure les réglages d’apparence et d’analyse du style choisi. Les différents styles peuvent ainsi représenter des tranches temporelles différentes si leurs nombres de lignes ou leurs intervalles diffèrent.

**Couverture temporelle validée : conserver le fonctionnement actuel.** Les lignes représentent les premières tranches disponibles du morceau, limitées par le nombre de lignes demandé et espacées selon l’intervalle réglé. Avec les réglages initiaux actuels (20 lignes, 0,5 seconde), les prélèvements conservés sont demandés de 0 à 9,5 secondes lorsque le fichier le permet. La feature ne demande ni répartition sur le morceau entier ni sélection d’extrait. Le nouveau style reprend cette couverture, avec ses propres valeurs initiales.

**Densité initiale validée pour le nouveau style : 80 lignes, toujours modifiables par l’utilisateur.** Avec l’intervalle initial de 0,5 seconde, les prélèvements conservés sont demandés de 0 à 39,5 secondes lorsque le fichier le permet. Si le fichier fournit moins de tranches, seules celles disponibles sont utilisées, selon le principe actuel. Le style existant conserve ses propres valeurs initiales ; ce choix ne lui impose pas 80 lignes.

**Origine des reliefs validée : représenter l’audio importé.** Le principe retenu est de partir du spectre audio comme actuellement et d’atténuer progressivement les reliefs vers les bords pour obtenir des extrémités plus plates. Les variations doivent provenir de l’audio, sans remplacer les données par des courbes aléatoires décoratives. Le premier développement emploie une enveloppe centrale déterministe et un tracé par segments aux jointures arrondies, inspirés de l’étude des projets existants.

**Dynamique validée : les passages calmes produisent des reliefs plus faibles que les passages intenses.** Employer une amplification commune au poster, sans normalisation indépendante de chaque ligne qui les ramènerait toutes à la même hauteur. L’enveloppe centrale doit conserver ces différences pour une même position horizontale. L’échelle exacte reste à régler sur le rendu ; le critère porte sur la conservation des contrastes d’intensité présents dans les données analysées, pas sur une mesure de volume perçu.

Les réglages et le rendu implémentés sont décrits dans les spécifications liées ; la [recette de validation](validation/README.md) conserve les premières images et les contrôles exécutés. Aucun seuil de ressemblance ni comparaison pixel par pixel avec la référence n’est imposé.

## Recherche sur le tracé

La [comparaison de trois projets existants](recherche-trace.md) examine leur code et précise les différences avec Harmonyz. La proposition technique est de s’inspirer de venkat24 pour l’enveloppe centrale et le masquage entre les courbes, tout en conservant les spectres et l’organisation des données d’Harmonyz. Ces principes ont guidé le premier développement, avec une implémentation propre à Harmonyz. Aucun code tiers n’a été ajouté.

## Cadrage visuel et première recette

Les critères ci-dessous traduisent la référence en points de comparaison concrets. Ils constituent une proposition de recette à affiner lors de la validation du rendu, sans imposer des pics identiques à ceux de l’image source.

| Élément          | Cible visuelle proposée                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Densité          | Un empilement serré de 80 lignes par défaut, dont les extrémités restent discernables.                                                                          |
| Silhouette       | Une zone de relief centrale irrégulière, avec plusieurs pics et des bords progressivement plus plats ; éviter une simple bosse identique sur toutes les lignes. |
| Trait            | Des contours fins et continus, avec un lissage qui conserve les accidents du signal ; éviter un aspect de vagues sinusoïdales uniformes.                        |
| Profondeur       | Les reliefs au premier plan cachent les courbes derrière eux grâce à un remplissage de la couleur du fond.                                                      |
| Composition      | Un bloc de courbes centré avec des marges, sans les zones réservées aux textes de l’image. Les proportions du dessin doivent rester cohérentes selon le format. |
| Origine audio    | Les variations des courbes proviennent des mesures audio. Un silence ne reçoit pas de pics artificiels pour ressembler à la référence.                          |
| Personnalisation | Le changement de couleurs conserve la silhouette, le masquage et la lisibilité du style.                                                                        |

Pour une première comparaison reproductible, le dépôt contient [song.mp3](../../../song.mp3), candidat à la recette. Aucune analyse de son contenu ni validation de rendu n’a été effectuée pendant ce cadrage. Comparer côte à côte l’export du nouveau style et la zone des courbes de la référence, à taille comparable ; examiner les critères ci-dessus plutôt qu’une égalité pixel par pixel entre deux signaux différents.

**Adaptation au format validée : le bloc de courbes s’adapte aux proportions du poster, y compris en paysage, avec des marges et des reliefs centraux.**

Ordre de travail retenu : régler d’abord le tracé, les reliefs, l’enveloppe centrale et les occultations sur un rendu audio fixe ; valider visuellement le résultat ; finaliser ensuite son intégration au sélecteur et aux réglages déjà décidés.

## Retours visuels et ajustements encore ouverts

1. Quelle interpolation, quelle largeur d’enveloppe centrale et quel rapport entre hauteur des pics et espacement donnent le rendu le plus proche de la référence ? Ces réglages techniques sont à comparer sur des images.
2. Quelles proportions et marges retenir selon le format, notamment en paysage ?
3. Comment figer la recette visuelle (audio, réglages et images de sortie) après un premier rendu examiné ?

Les premiers noms affichés sont « Spectrum » et « Joy Division ».

Les décisions seront consignées à mesure qu’elles seront confirmées. Le [glossaire](glossaire.md) consigne les termes clarifiés ; une ADR ne sera ajoutée que si un arbitrage architectural durable le justifie.

[Retour aux fonctionnalités](../README.md).
