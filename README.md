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

Dans ce mode, la connexion Discord et la page "Serveurs Minecraft"
affichent une erreur au lieu de fonctionner — c'est attendu, c'est un mode
"design only".

## Connexion Discord (réelle)

⚠️ **`server/index.js` et `Beep/bot.py` n'ont pas pu être exécutés pendant
leur développement** : ni Node.js ni les dépendances Python (discord.py,
aiohttp) ne sont installés sur la machine qui a généré ce code. Les deux
fichiers ont été relus attentivement et leur syntaxe vérifiée, mais
testez-les avant de vous y fier en production (voir la section suivante).

1. Dans [discord.com/developers/applications](https://discord.com/developers/applications),
   onglet **OAuth2** de l'application Beep : ajoutez une **Redirect URI**
   qui correspond exactement à `DISCORD_REDIRECT_URI` (ex.
   `https://beep.renardis.fr/api/auth/callback`, ou
   `http://localhost:3000/api/auth/callback` pour tester en local).
2. `cp .env.example .env` puis renseignez `DISCORD_CLIENT_ID`,
   `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` et un `SESSION_SECRET`
   aléatoire (commande fournie dans le fichier).
3. `node server/index.js` (ou `npm start`).

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

## Connexion au bot Beep (page "Serveurs Minecraft")

La page Serveurs Minecraft (classement, votes, commentaires, panneau
"Gestion serveur") parle au **vrai bot Beep**, pas à des données
fictives. Trois maillons :

```
Navigateur → server/index.js (Node, ce repo) → Beep/bot.py (Python, API interne 127.0.0.1)
```

- `server/index.js` expose `/api/servers*` : il vérifie la vraie session
  Discord (est-ce que cette personne est bien admin de CE serveur avant
  de la laisser modifier quoi que ce soit), puis relaie vers le bot.
- `Beep/bot.py` expose une API interne (`WEB_API_PORT`, en localhost
  uniquement, jamais publique) qui lit/écrit directement dans
  `config.json` — le même fichier utilisé par les commandes Discord du
  bot. Voir `Beep/bot.py`, section "API INTERNE POUR LE SITE WEB", et
  `Beep/DEPLOIEMENT.md`.

**Pour l'activer :**
1. Dans `Beep/.env` (sur le VPS, à côté de `DISCORD_TOKEN`) : renseigner
   `WEB_API_SECRET` (chaîne aléatoire) — voir `Beep/.env.example`.
2. Dans le `.env` de ce repo : `BOT_API_SECRET` = **exactement la même
   valeur**.
3. Redémarrer les deux services (`beep-bot` et `beep-web`).

Sans ça, la page affiche une erreur claire ("bot Beep injoignable") au
lieu de planter — les autres pages du site ne sont pas affectées.

**Limite connue** : les enchères ("enchères" au sens strict, avec
montée de prix) n'existent pas encore côté bot — seulement des annonces
à prix fixe. La page "Shop inter-joueurs" du site reste donc simulée
pour l'instant (voir plus bas).

## Ce qui est réel vs simulé

- **Connexion Discord** : réelle.
- **Profil de Beep** (avatar, bannière, description, `#discriminateur`,
  date de création, numéro de version) : réel — `GET /api/bot-profile`,
  relayé vers le vrai profil Discord du bot (`Beep/bot.py`,
  `bot.fetch_user` + `application_info()` + la constante `VERSION`).
  Partagé par toute l'app via `src/store/botProfile.js` (un seul fetch,
  pas un numéro de version différent par page). Se rabat sur les valeurs
  fictives si un champ n'est pas défini sur Discord (ex. pas de
  bannière) ou si le bot est injoignable.
- **Index des commandes** (`/index`) : réel — `GET /api/commands` lit
  directement l'arbre de commandes du bot (`bot.tree.get_commands()`),
  jamais recopié à la main donc jamais désynchronisé quand une commande
  est ajoutée/renommée/retirée côté bot.
- **Serveurs Minecraft, votes, commentaires** : réels, stockés dans
  `Beep/config.json` via l'API interne du bot (voir ci-dessus).
- **PikaCoins, badges, réglages de profil** (`src/store/auth.js`) : pas
  encore reliés au bot (qui, lui, a bien un vrai système PikaCoins/shop/
  marché — voir `Beep/bot.py`). En attendant, chaque profil est
  initialisé à des valeurs par défaut et persisté dans le `localStorage`
  du navigateur, par id Discord (chaque personne a SES propres données,
  mais rien n'est synchronisé entre appareils ni avec le vrai solde du
  bot).
- **Shop admin, shop joueurs** (`src/data/shop.js`) : simulés, aucune
  vraie transaction.
- **Inventaire** (`src/data/inventory.js`) : simulé.
- **Statut de Beep** (`src/data/status.js`) : valeurs figées, pas de vrai
  ping vers le bot.

## Architecture

Même logique de séparation que sur les projets full-stack de l'équipe
(ex. CookNest en Next.js/Prisma) : une couche **actions** pour les
mutations, une couche **data** pour les modèles mock restants, une
couche **lib** pour les utilitaires partagés.

```
index.html                 point d'entrée, import map (vue / vue-router auto-hébergés)
src/main.js                 création de l'app Vue + router + directive click-outside
src/App.js                   layout racine (header + router-view + footer)
src/router/                  définition des routes (hash history)

server/index.js              backend Node : OAuth2 Discord, proxy /api/servers* -> bot Beep,
                              fichiers statiques (zéro dépendance)
.env.example                 variables d'environnement attendues par server/index.js

src/store/auth.js            session réelle : lit /api/auth/me, login()/logout() via l'API
src/store/botProfile.js      profil Discord réel de Beep, partagé par toute l'app (un seul fetch)
src/data/                    couche "modèle" restante : fixtures réactives pour ce qui n'est
                              pas encore branché au bot (shop, inventaire, statut, crédits)
src/actions/                 couche "mutation" : servers.js et bot.js parlent au vrai bot (fetch),
                              shop.js/profile.js mutent encore des données locales —
                              chaque action retourne { success, message? }
src/lib/                     utilitaires partagés : formatage (format.js), génération d'id
                              (utils.js), validation de formulaire (validations.js)

src/components/ui/           atomes réutilisables (sélecteur de serveur, vote, toggle, podium, marquee…)
src/components/layout/       header / footer
src/pages/                   une page par route, ne contient que l'état d'UI (formulaires, dropdowns) —
                              toute la logique métier passe par src/actions/

src/style/                   tokens (couleurs/typo), base, composants, pages
assets/fonts/                 Bricolage Grotesque, Instrument Sans, Fragment Mono (auto-hébergées)
vendor/                       Vue + Vue Router auto-hébergés (builds ESM navigateur)
deploy/beep-web.service       unité systemd — voir DEPLOIEMENT.md
```

## Prochaines étapes pour finir de brancher le vrai backend Beep

1. Ajouter au bot (`Beep/bot.py`) des endpoints internes équivalents pour
   l'économie (solde PikaCoins, historique), l'inventaire, le shop admin
   et le marché joueurs — sur le modèle de ce qui existe déjà pour les
   serveurs Minecraft (`_guild_public_summary`, `handle_*`, section "API
   INTERNE POUR LE SITE WEB").
2. Dans `src/actions/shop.js` et `src/actions/profile.js`, remplacer les
   mutations locales par des appels `fetch()` vers ces nouveaux
   endpoints, sur le modèle de `src/actions/servers.js`.
3. Remplacer le profil "local par défaut" de `src/store/auth.js` par les
   vraies données renvoyées par le bot.
4. Si besoin d'un vrai outillage (TypeScript strict, tests, minification,
   découpage en `.vue` SFC) : `npm create vite@latest` avec le template
   `vue`, puis déplacer les fichiers de `src/` — la logique n'a pas besoin
   de changer, seule la syntaxe `template: \`...\`` devient un bloc
   `<template>`.

## Crédits

Développement : MrIllian, space_it_ · Design : Kandra, Hyouhyou · Écriture :
Kishiro · Hébergement : space_it_, Renardis.
