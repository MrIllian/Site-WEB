import { reactive } from "vue";

export const servers = reactive([
  {
    id: "srv1",
    name: "Kaonyx SMP",
    ip: "play.kaonyx.net",
    port: 25565,
    description: "SMP semi-vanilla, économie de joueurs, claims LWC et évents mensuels. Ambiance calme, whitelist légère.",
    tags: ["SMP", "Survie", "Économie", "Whitelist"],
    isPublic: true,
    ownerId: "u_demo",
    upvotes: 341,
    downvotes: 12,
    userVote: 0,
    online: true,
    players: { now: 47, max: 120 },
    comments: [
      { id: "c1", author: "Fennwick", time: "il y a 2 j", body: "Staff hyper réactif, j'ai jamais autant duré sur un SMP." },
      { id: "c2", author: "Iroko_", time: "il y a 5 j", body: "Les évents de fin de mois valent le détour, bonne ambiance." },
    ],
  },
  {
    id: "srv2",
    name: "Voltaria Faction",
    ip: "voltaria.gg",
    port: 25565,
    description: "Serveur faction PvP avec cartes saisonnières, raid protégé la nuit et boutique cosmétique.",
    tags: ["Faction", "PvP", "Saisonnier"],
    isPublic: true,
    ownerId: "u2",
    upvotes: 298,
    downvotes: 34,
    userVote: 0,
    online: true,
    players: { now: 112, max: 200 },
    comments: [
      { id: "c3", author: "Marëo", time: "il y a 1 j", body: "Saison 4 vraiment bien équilibrée, les raids sont justes." },
    ],
  },
  {
    id: "srv3",
    name: "Petit Bois",
    ip: "petitbois.fr",
    port: 25577,
    description: "Petit serveur familial entre amis, coop et créatif partagé, pas de PvP forcé.",
    tags: ["Coop", "Créatif", "Familial"],
    isPublic: true,
    ownerId: "u_demo",
    upvotes: 76,
    downvotes: 3,
    userVote: 0,
    online: true,
    players: { now: 6, max: 20 },
    comments: [],
  },
  {
    id: "srv4",
    name: "Néréïde RP",
    ip: "nereide-rp.fr",
    port: 25565,
    description: "Roleplay médiéval-fantastique, économie fermée, guildes et quêtes scénarisées par le staff.",
    tags: ["RP", "Médiéval", "Guildes"],
    isPublic: true,
    ownerId: "u3",
    upvotes: 210,
    downvotes: 21,
    userVote: 0,
    online: false,
    players: { now: 0, max: 80 },
    comments: [
      { id: "c4", author: "Solweig", time: "il y a 3 j", body: "L'univers est incroyablement travaillé, le staff écrit des quêtes sur mesure." },
    ],
  },
  {
    id: "srv5",
    name: "Blockrun",
    ip: "blockrun.eu",
    port: 25565,
    description: "Minijeux compétitifs : bedwars, skywars, parkour classé. Saisons de 6 semaines.",
    tags: ["Minijeux", "PvP", "Classé"],
    isPublic: true,
    ownerId: "u4",
    upvotes: 654,
    downvotes: 58,
    userVote: 0,
    online: true,
    players: { now: 340, max: 500 },
    comments: [
      { id: "c5", author: "Ptit_Ker", time: "il y a 6 h", body: "Le mode classé bedwars est enfin stable, plus de lag en finale." },
      { id: "c6", author: "Anouka", time: "il y a 1 j", body: "Ranked parkour trop stylé, ajoutez plus de maps svp" },
    ],
  },
  {
    id: "srv6",
    name: "Tessara Origins",
    ip: "tessara.net",
    port: 25565,
    description: "Modpack RPG (mods de progression et donjons), difficulté ajustée, coop 2-8 joueurs.",
    tags: ["Modpack", "RPG", "Donjons"],
    isPublic: false,
    ownerId: "u_demo",
    upvotes: 18,
    downvotes: 1,
    userVote: 0,
    online: true,
    players: { now: 3, max: 8 },
    comments: [],
  },
]);

export const currentUserAdminServerIds = ["srv1", "srv3", "srv6"];

export function rankedServers() {
  return servers
    .filter((s) => s.isPublic)
    .slice()
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
}
