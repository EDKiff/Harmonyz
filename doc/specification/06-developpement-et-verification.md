# 06 — Développement et vérification

## Démarrer le projet

Le verrou inspecté contient Vite 7.3.3, dont la contrainte Node est `^20.19.0 || >=22.12.0`. La CI utilise Node 24. L’audit local a utilisé Node `22.23.2` et npm `10.9.8`.

```bash
npm ci
npm run dev
```

Ouvrir l’adresse indiquée par Vite, habituellement `http://localhost:5173`. Aucun secret, fichier `.env` ou service métier externe n’est requis par le code inspecté. Le navigateur doit prendre en charge `AudioContext`, `OfflineAudioContext` et Canvas 2D.

`song.mp3` à la racine peut être sélectionné manuellement dans l’import. Il n’est pas servi comme une démonstration intégrée.

## Commandes disponibles

| Commande            | Fonction                                                                     |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Développement avec rechargement à chaud.                                     |
| `npm run typecheck` | Génération des types React Router puis compilation TypeScript sans émission. |
| `npm run lint`      | Vérification Prettier de tout le dépôt ; pas d’analyse ESLint.               |
| `npm run lint:fix`  | Réécriture du formatage de tout le dépôt.                                    |
| `npm run build`     | Production de `build/client/` et `build/server/`.                            |
| `npm start`         | Service du build via `react-router-serve`, normalement sur le port 3000.     |

Aucun script de test ni framework de test métier n’est présent dans `package.json`. Le fichier `app/welcome/test.html` n’est pas une suite de tests automatisés.

## Vérifications réalisées pour cet audit

Les dépendances présentes dans le workspace ont été utilisées sans réinstallation. Elles diffèrent du verrou sur certaines versions : React 19.2.4, Vite 7.3.1, Tailwind CSS 4.1.18 et Prettier 3.8.1 sont installés localement. Les résultats ci-dessous sont locaux ; ils ne prouvent ni une installation propre par `npm ci` ni l’état d’une exécution distante de la CI.

| Contrôle                                                    | Résultat                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run typecheck`                                         | Réussi.                                                                              |
| `npm run build`                                             | Réussi pour le client et le serveur.                                                 |
| `npm run lint`                                              | Réussi.                                                                              |
| Liens locaux du README racine et de `doc/`                  | 60 liens vérifiés après réorganisation, aucune cible manquante.                      |
| Démarrage du build avec `npm start` et requête HTTP sur `/` | HTTP 200 ; titre Harmonyz, état vide et sélecteur MP3 présents dans le HTML serveur. |

L’import MP3, le rendu spectral, la fidélité des couleurs, le téléchargement et la compatibilité mobile restent à vérifier dans un navigateur. Aucune campagne de performance ni construction Docker n’a été effectuée.

## Recette manuelle pour la reprise

| Scénario                                          | Points à observer                                                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Ouvrir `/` sans fichier                           | État vide, boutons utilisables au clavier, Save désactivé.                                                                 |
| Importer un MP3 de plusieurs minutes              | Fin du calcul, aperçu présent, absence de son joué ; avec l’algorithme actuel, seules les premières lignes sont dessinées. |
| Importer un signal connu, par exemple 1 kHz       | Position du pic et repères ; le code actuel doit révéler le décalage fréquentiel documenté.                                |
| Changer une couleur, puis un preset               | Palette obtenue, recalcul actuellement déclenché, conservation des champs non inclus dans le preset.                       |
| Passer A4 → A3 → personnalisé, puis paysage       | Résolutions annoncées, conversion cm/px et échange des dimensions.                                                         |
| Exporter un A4 puis un personnalisé à 300 DPI     | Dimensions réelles des PNG et concordance avec le dessin.                                                                  |
| Choisir un faux MP3 ou un fichier corrompu        | Échec de décodage et comportement de reprise ; l’éditeur actuel ne présente pas de message dédié.                          |
| Essayer silence et fichier de moins d’une seconde | Données vides ou uniformes, lisibilité et validité de l’export.                                                            |
| Modifier rapidement plusieurs réglages            | Résultat final associé à la dernière demande, durée et ressources utilisées.                                               |
| Utiliser un petit écran et masquer les panneaux   | Visibilité du poster, accès aux réglages et absence de commandes hors écran.                                               |

Pour tester les limites de taille, commencer par des dimensions modestes et observer les bornes du code avant toute allocation importante : le plafond actuel en mm/DPI permet des surfaces de canevas excessives.

## Docker et chaîne de livraison

Le [Dockerfile](../../Dockerfile) utilise plusieurs étapes : installation des dépendances complètes, installation des dépendances de production, build, puis image finale exécutant `npm run start`.

```bash
docker build -t harmonyz .
docker run --rm -p 3000:3000 harmonyz
```

Toutes les étapes partent de `node:20-alpine`, tandis que les workflows utilisent Node 24. La version mineure de l’image Node 20 n’est pas figée ; elle doit satisfaire la contrainte de Vite. Les environnements Docker et CI ne sont donc pas alignés sur la même version majeure de Node.

| Workflow                                                         | Comportement déclaré                                                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [lint_and_build.yml](../../.github/workflows/lint_and_build.yml) | Workflow réutilisable : `npm ci`, Prettier, typecheck, build.                                                                                               |
| [release.yml](../../.github/workflows/release.yml)               | Sur push dans `main` : appelle les contrôles, peut incrémenter la version patch, créer/pousser un commit et un tag, puis lancer la construction de l’image. |
| [build_image.yml](../../.github/workflows/build_image.yml)       | Workflow réutilisable : build et publication GHCR sous un tag lu dans `package.json`.                                                                       |

Le code ne déclare pas de déclenchement `pull_request` pour ces contrôles. Le checkout du job image n’est pas explicitement lié au commit créé par le job de version ; la concordance entre commit versionné et image publiée doit être vérifiée sur une exécution réelle. Aucun déploiement applicatif vers un hébergement n’est défini dans ces workflows.

L’audit n’a lancé ni publication d’image, ni tag, ni push.
