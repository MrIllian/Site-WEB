export const bot = {
  name: "Beep",
  tag: "Beep#9080",
  version: "v0.8.7",
  codename: "« Bêta »",
  banner: true,
  bio: "petit compagnon qui veille sur vos serveurs Minecraft depuis Discord. ping, whitelist, classements, shops, économie — beep s'occupe du reste pendant que vous jouez.",
  invite: "#",
};

export const news = [
  {
    id: "n1",
    date: "2026-08-01",
    tag: "MAJ",
    title: "Enchères inter-joueurs en bêta",
    body: "Le shop inter-joueurs propose désormais des enchères horodatées avec relance automatique dans les dernières 60 secondes.",
  },
  {
    id: "n2",
    date: "2026-07-24",
    tag: "FIX",
    title: "Ping serveur plus précis",
    body: "Le module de statut interroge maintenant chaque serveur toutes les 30 secondes via requête Query au lieu du ping standard.",
  },
  {
    id: "n3",
    date: "2026-07-12",
    tag: "NOUVEAU",
    title: "Classement public des serveurs",
    body: "Les administrateurs peuvent rendre leur serveur visible publiquement et laisser la communauté voter.",
  },
  {
    id: "n4",
    date: "2026-06-30",
    tag: "MAJ",
    title: "PikaCoins synchronisées entre serveurs",
    body: "Votre solde de PikaCoins suit désormais votre profil Discord, quel que soit le serveur sur lequel vous jouez.",
  },
];

// Messages fixes du bandeau défilant — les messages chiffrés (nombre de
// serveurs, ping…) sont ajoutés par HomePage à partir de /api/stats.
export const ticker = [
  "nouvelle commande /whitelist ajouter",
  "les enchères inter-joueurs sont en bêta",
];
