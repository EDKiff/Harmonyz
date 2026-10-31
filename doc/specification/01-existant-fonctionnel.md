# 01 — Existant fonctionnel

## Produit présent dans le dépôt

Harmonyz expose une seule page, `/`, intitulée « Harmonyz », avec la description « Cool music posters ». L’interface est en anglais. Elle affiche un poster au centre et deux panneaux flottants à droite : format et personnalisation. Ils sont ouverts au démarrage et peuvent être masqués depuis la barre d’outils.

Deux styles sont sélectionnables : **Spectrum** (rendu historique, sélectionné au démarrage) et **Joy Division** (courbes blanches sur noir par défaut, sans axes). Chaque style conserve ses réglages d’apparence et d’analyse pendant la session ; fichier et format sont communs.

Le dessin est un empilement de courbes de spectre : chaque ligne correspond à un instant du morceau ; horizontalement, les points représentent des bandes de fréquences ; les reliefs représentent leur intensité. Des repères de temps et des noms de notes accompagnent le style Spectrum.

Cette représentation utilise des mesures audio. Elle ne repose sur aucun modèle d’IA, aucune recherche de pochette et aucune identification de titre ou d’artiste.

Sources : [route](../../app/routes/home.tsx), [éditeur](../../app/welcome/welcome.tsx), [rendu](../../app/renderer/PosterComponent.tsx).

## Parcours implémenté

1. **Ouvrir la page.** Un encart « No poster yet » invite à charger une musique. Les réglages sont disponibles avant l’import.
2. **Cliquer sur Load.** Le sélecteur de fichiers demande un MP3 avec `accept=".mp3,audio/mpeg"`. Ce filtre ne remplace pas une validation du contenu. Un seul fichier est utilisé.
3. **Choisir un morceau.** Le fichier reste dans la mémoire du navigateur. Le nom et la taille apparaissent dans le panneau de personnalisation ; les séries du précédent poster sont effacées.
4. **Attendre l’analyse.** La génération démarre automatiquement. Un voile bloque l’interface avec le message « Rendering your poster... ». Il n’y a ni progression chiffrée ni bouton d’annulation.
5. **Personnaliser.** Le sélecteur Drawing style, au-dessus des onglets, choisit le rendu. L’onglet Advanced propose couleurs, épaisseur, police des axes, nombre de lignes, plage de fréquences et réglages audio. Presets propose quatre ambiances.
6. **Choisir un format.** A4, A3 ou dimensions personnalisées en cm/px, avec orientation et DPI pour le format personnalisé.
7. **Cliquer sur Save.** Le navigateur télécharge un PNG du canevas, nommé d’après le fichier et les dimensions en millimètres. Le bouton est désactivé avant une première génération et pendant les calculs.

Tout changement de l’état du poster est répercuté après 250 ms sans nouvelle modification, puis demande une génération. Le générateur réutilise une analyse en cache si les paramètres audio correspondent ; couleurs, format et nombre de lignes ne provoquent alors aucun nouveau décodage. Le nom « throttle » employé dans le code correspond ici à une temporisation de type debounce.

Sources : [Welcome](../../app/welcome/welcome.tsx), [FormatPanel](../../app/welcome/FormatPanel.tsx), [PersonalizationPanel](../../app/welcome/PersonalizationPanel.tsx).

## Capacités et limites fonctionnelles

| Besoin                                              | État constaté                                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Importer une musique locale                         | Sélecteur MP3 ; pas de glisser-déposer ni de contrôle explicite de taille/durée.                                       |
| Produire un visuel issu du son                      | Analyse spectrale locale et rendu Canvas 2D implémentés. Fidélité à corriger, voir [03](03-analyse-audio-et-rendu.md). |
| Représenter le morceau entier                       | Tout le morceau est analysé, mais seules les premières tranches sont conservées pour le dessin.                        |
| Choisir une apparence                               | Réglages avancés et deux styles et quatre presets partiels.                                                            |
| Ajuster le support                                  | Formats et orientation présents ; résolution différente entre formats standards et personnalisé.                       |
| Télécharger                                         | PNG uniquement, issu du canevas de prévisualisation.                                                                   |
| Ajouter titre, artiste ou texte libre au poster     | Absent. Le nom de fichier est affiché dans l’interface, pas composé dans le poster.                                    |
| Écouter ou choisir un extrait                       | Aucun lecteur, curseur de lecture ni sélection d’intervalle.                                                           |
| Sauvegarder un projet et le reprendre               | Aucun stockage local ni serveur ; les réglages et le fichier disparaissent au rechargement.                            |
| Importer depuis une plateforme musicale             | Aucune intégration Spotify, YouTube ou autre service.                                                                  |
| Créer un compte, partager, commander une impression | Aucun de ces parcours n’est implémenté.                                                                                |
| Installer une application mobile ou une PWA         | Aucun manifeste ni service worker applicatif dans le dépôt.                                                            |

## Erreurs et confidentialité observables

Les erreurs de génération sont envoyées à `console.error`, sans message explicatif dans l’éditeur ni action de reprise dédiée. Après l’échec d’un recalcul, le poster est invalidé et Save reste désactivé.

Le code applicatif ne transmet pas le fichier audio à un serveur et n’effectue pas d’appel à une API musicale. Le serveur sert l’application ; le navigateur assure le traitement audio. La page charge néanmoins la police Inter depuis Google Fonts : le fonctionnement local de l’audio ne signifie pas une absence totale de requêtes réseau.

Sources : [gestion de génération et export](../../app/welcome/welcome.tsx), [chargement des polices](../../app/root.tsx).
