# Beep — site web

Front-end du site de **Beep**, bot Discord pour serveurs Minecraft. Vue 3
(Composition API), sans étape de build : les modules ES sont chargés
directement par le navigateur via un import map (`vue` et `vue-router` sont
auto-hébergés dans `/vendor`, pas de CDN à l'exécution). Le backend
(`server/`) est un serveur Node natif, zéro dépendance npm.

> Pourquoi pas Vite pour le front ? Node.js n'était pas installé sur la
> machine utilisée pour générer ce projet. Le code est écrit en Vue 3
> "propre" (Composition API, un composant par fichier) donc migrer vers un
> vrai build Vite plus tard est trivial.

## Lancer le site

**Avec la vraie connexion Discord** (nécessite Node.js ≥ 18) :

```bash
cp .env.example .env   # puis renseigner les valeurs, voir plus bas
node server/index.js   # ou : npm start
```

puis ouvrir `http://localhost:3000` (ou le `PORT` choisi dans `.env`).

**Aperçu visuel seul, sans backend** (pour retoucher le design sans
Node.js) :

```bash
python3 -m http.server 5173
```

Dans ce mode, cliquer sur "Se connecter avec Discord" redirige vers
`/api/auth/login` qui n'existe pas → 404. C'est attendu, c'est un mode
"design only".

## Connexion Discord (réelle)

⚠️ **Le serveur `server/index.js` n'a pas pu être testé pendant son
développement** : Node.js n'est pas installé sur la machine qui a généré ce
code. Le fichier a été relu attentivement (API Node natives uniquement :
`http`, `https`, `crypto`, `fs`, `path`) mais vérifiez qu'il démarre sans
erreur avant de vous y fier en production.

1. Dans [discord.com/developers/applications](https://discord.com/developers/applications),
   onglet **OAuth2** de l'application Beep : ajoutez une **Redirect URI**
   qui correspond exactement à `DISCORD_REDIRECT_URI` (ex.
   `https://beep.renardis.fr/api/auth/callback`, ou
   `http://localhost:3000/api/auth/callback` pour tester en local).
2. `cp .env.example .env` puis renseignez `DISCORD_CLIENT_ID`,
   `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` et un `SESSION_SECRET`
   aléatoire (commande fournie dans le fichier).
3. `node server/index.js   # ou : npm start`.

Ce que fait le serveur : redirige vers Discord (`/api/auth/login`),
échange le code contre un token et récupère le profil réel côté serveur
(`/api/auth/callback` — le `client_secret` ne quitte jamais cette machine),
pose un cookie de session signé (HMAC, pas de base de données), et
l'expose au front via `/api/auth/me`. Il sert aussi les fichiers statiques
du site (même origine → pas de souci CORS/cookies).

**Ce qui est réel une fois connecté** : identité (pseudo, avatar, id
Discord) et la liste des serveurs Discord où la personne est
administratrice (scope `guilds`, permission `ADMINISTRATOR` ou
`MANAGE_GUILD`).

**Ce qui reste local/mock** : il n'y a pas encore de vraie base de données
pour les PikaCoins, badges, etc. — chaque profil est donc initialisé à des
valeurs par défaut et persisté dans le `localStorage` du navigateur, par id
Discord (donc chaque personne a bien SES propres données, mais elles ne
sont pas synchronisées entre appareils). Et le panneau "Gestion serveur"
n'affichera aucun serveur tant qu'aucun de `src/data/servers.js` n'a de
`guildId` correspondant à un vrai serveur Discord — renseignez-en un pour
tester avec votre compte.

## Ce qui est réel vs simulé

- **Connexion Discord** : réelle (voir ci-dessus).
- **Serveurs Minecraft, votes, commentaires** (`src/data/servers.js`) :
  tableau réactif en mémoire côté navigateur, perdu au rechargement —
  pas encore relié à une vraie base de données.
- **PikaCoins, shop admin, shop joueurs** (`src/data/shop.js`) : idem,
  aucune vraie transaction, pas de synchronisation entre joueurs.
- **Statut de Beep** (`src/data/status.js`) : valeurs figées, pas de vrai
  ping vers le bot.

## Architecture

Même logique de séparation que sur les projets full-stack de l'équipe
(ex. CookNest en Next.js/Prisma) : une couche **actions** pour les
mutations, une couche **data** pour les modèles, une couche **lib** pour
les utilitaires partagés.

```
index.html                 point d'entrée, import map (vue / vue-router auto-hébergés)
src/main.js                 création de l'app Vue + router + directive click-outside
src/App.js                   layout racine (header + router-view + footer)
src/router/                  définition des routes (hash history)

server/index.js              backend : OAuth2 Discord + fichiers statiques (zéro dépendance)
.env.example                 variables d'environnement attendues par server/index.js

src/store/auth.js            session réelle : lit /api/auth/me, login()/logout() via l'API
src/data/                    couche "modèle" : fixtures réactives (serveurs, shop, statut, crédits)
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

## Prochaines étapes pour brancher le vrai backend Beep

1. Dans `src/actions/*.js`, remplacer les mutations directes sur les
   objets de `src/data/*.js` par des appels `fetch()` vers l'API du bot
   Beep. Comme chaque action retourne déjà `{ success, message? }`, les
   pages n'ont rien à changer.
2. Remplacer les fichiers `src/data/*.js` par le résultat de ces appels
   API (mêmes noms de champs pour ne pas casser les pages), et associer
   chaque serveur à son `guildId` Discord réel.
3. Remplacer le profil "local par défaut" de `src/store/auth.js`
   (PikaCoins, badges, settings) par de vraies données persistées côté
   Beep, renvoyées par `/api/auth/me`.
4. Si besoin d'un vrai outillage (TypeScript strict, tests, minification,
   découpage en `.vue` SFC) : `npm create vite@latest` avec le template
   `vue`, puis déplacer les fichiers de `src/` — la logique n'a pas besoin
   de changer, seule la syntaxe `template: \`...\`` devient un bloc
   `<template>`.

## Crédits

Développement : MrIllian, space_it_ · Design : Kandra, Hyouhyou · Écriture :
Kishiro · Hébergement : space_it_, Renardis.
