import { reactive } from "vue";

export const currentUser = reactive({
  id: "u_demo",
  username: "kevin",
  discriminator: "houellebecq",
  initials: "KH",
  accentColor: "#8c73ff",
  memberSince: "2023-11-02",
  pikaCoins: 4820,
  pikaCoinsHistory: [
    { id: "h1", label: "Vente — Épée d'ender", delta: +650, time: "il y a 2 h" },
    { id: "h2", label: "Achat — Rang Voyageur", delta: -1200, time: "il y a 1 j" },
    { id: "h3", label: "Récompense de vote quotidien", delta: +50, time: "il y a 1 j" },
    { id: "h4", label: "Enchère remportée — Cheval squelette", delta: -980, time: "il y a 3 j" },
    { id: "h5", label: "Récompense d'évènement Kaonyx SMP", delta: +300, time: "il y a 5 j" },
  ],
  settings: {
    accent: "violet",
    showBadges: true,
    publicProfile: true,
    compactCards: false,
    bio: "toujours en train de miner quelque chose sur Kaonyx SMP.",
  },
  badges: [
    { id: "b1", label: "Membre fondateur", tone: "brand" },
    { id: "b2", label: "Admin vérifié", tone: "lime" },
    { id: "b3", label: "Top voteur", tone: "amber" },
  ],
});

export const accentOptions = [
  { id: "violet", label: "Violet", color: "#8c73ff" },
  { id: "lime", label: "Lime", color: "#c6ff5e" },
  { id: "amber", label: "Ambre", color: "#ffbf4d" },
  { id: "coral", label: "Corail", color: "#ff5d73" },
  { id: "cyan", label: "Cyan", color: "#5ee6d0" },
];
