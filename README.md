# Beep — site web

Front-end du site de **Beep**, bot Discord pour serveurs Minecraft. Vue 3
(Composition API), sans étape de build : les modules ES sont chargés
directement par le navigateur via un import map (`vue` et `vue-router` sont
auto-hébergés dans `/vendor`, pas de CDN à l'exécution).

> Pourquoi pas Vite ? Node.js n'était pas installé sur la machine utilisée
> pour générer ce projet. Le code est écrit en Vue 3 "propre" (Composition
> API, un composant par fichier) donc migrer vers un vrai build Vite plus
> tard est trivial — voir "Prochaines étapes" plus bas.

## Lancer le site

N'importe quel serveur de fichiers statiques fait l'affaire, par exemple :

```bash
python3 -m http.server 5173
```

puis ouvrir `http://localhost:5173`.

## Ce qui est réel vs simulé

Tout le visuel, la navigation, les 8 pages et les interactions (vote,
commentaires, achats, enchères, édition d'un serveur, paramètres de profil)
sont **fonctionnels**, mais branchés sur des données fictives en mémoire
(`src/data/*.js`) — rien n'est encore connecté au vrai bot Beep.

- **Connexion Discord** (`src/store/auth.js`) : simulée. Il n'y a pas de
  vrai flux OAuth2 (il faut un `client_id`/`client_secret` d'application
  Discord côté bot). Le store expose la même forme de données qu'un vrai
  flux OAuth renverrait, pour que le branchement futur ne touche que ce
  fichier. L'état de connexion est mémorisé dans `localStorage` pour la
  démo.
- **Serveurs Minecraft, votes, commentaires** (`src/data/servers.js`) :
  tableau réactif en mémoire, perdu au rechargement.
- **PikaCoins, shop admin, shop joueurs** (`src/data/shop.js`,
  `src/data/profile.js`) : idem, aucune vraie transaction.
- **Statut de Beep** (`src/data/status.js`) : valeurs figées, pas de vrai
  ping vers le bot.

## Architecture

Même logique de séparation que sur les projets full-stack de l'équipe
(ex. CookNest en Next.js/Prisma) : une couche **actions** pour les
mutations, une couche **data** pour les modèles, une couche **lib** pour
les utilitaires partagés — seule la techno change (Vue au lieu de
Next.js, pas de vraie base de données).

```
index.html                 point d'entrée, import map (vue / vue-router auto-hébergés)
src/main.js                 création de l'app Vue + router + directive click-outside
src/App.js                   layout racine (header + router-view + footer)
src/router/                  définition des routes (hash history)

src/store/auth.js            état de session (mock) : isAuthenticated, user, login(), logout()
src/data/                    couche "modèle" : fixtures réactives (serveurs, shop, profil, statut, crédits)
src/actions/                 couche "mutation" : vote, sauvegarde serveur, achat, enchère, mise en vente,
                              paramètres de profil — chaque action retourne { success, message? },
                              c'est le point d'entrée à remplacer par de vrais appels API plus tard
src/lib/                     utilitaires partagés : formatage (format.js), génération d'id (utils.js),
                              validation de formulaire (validations.js)

src/components/ui/           atomes réutilisables (sélecteur de serveur, vote, toggle, podium, marquee…)
src/components/layout/       header / footer
src/pages/                   une page par route, ne contient que l'état d'UI (formulaires, dropdowns) —
                              toute la logique métier passe par src/actions/

src/style/                   tokens (couleurs/typo), base, composants, pages
assets/fonts/                 Bricolage Grotesque, Instrument Sans, Fragment Mono (auto-hébergées)
vendor/                       Vue + Vue Router auto-hébergés (builds ESM navigateur)
```

## Prochaines étapes pour brancher le vrai backend

1. Remplacer le contenu de `src/store/auth.js` par un vrai flux OAuth2
   Discord (redirection vers `discord.com/oauth2/authorize`, échange du
   code contre un token côté serveur — jamais côté client).
2. Dans `src/actions/*.js`, remplacer les mutations directes sur les
   objets de `src/data/*.js` par des appels `fetch()` vers l'API du bot
   Beep. Comme chaque action retourne déjà `{ success, message? }`, les
   pages n'ont rien à changer.
3. Remplacer les fichiers `src/data/*.js` par le résultat de ces appels
   API (mêmes noms de champs pour ne pas casser les pages).
4. Si besoin d'un vrai outillage (TypeScript strict, tests, minification,
   découpage en `.vue` SFC) : `npm create vite@latest` avec le template
   `vue`, puis déplacer les fichiers de `src/` — la logique n'a pas besoin
   de changer, seule la syntaxe `template: \`...\`` devient un bloc
   `<template>`.

## Crédits

Développement : MrIllian, space_it_ · Design : Kandra, Hyouhyou · Écriture :
Kishiro · Hébergement : space_it_, Renardis.
