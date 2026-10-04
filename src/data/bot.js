export const bot = {
  name: "Beep",
  tag: "Beep#9080",
  // Repli uniquement si le bot ne répond pas : la vraie version vient de
  // /api/bot-profile (store/botProfile.js).
  version: "—",
  banner: true,
  bio: "petit compagnon qui veille sur vos serveurs Minecraft depuis Discord. ping, whitelist, classements, shops, économie — beep s'occupe du reste pendant que vous jouez.",
  invite: "#",
};

// Messages fixes du bandeau défilant — les messages chiffrés (nombre de
// serveurs, ping…) sont ajoutés par HomePage à partir de /api/stats.
export const ticker = [
  "vendez vos objets aux autres membres sur le marché",
  "consultez votre inventaire et vos soldes sur le site",
];
