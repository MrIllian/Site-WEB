import { reactive } from "vue";

export const inventoryByServer = reactive({
  srv1: {
    roles: [
      { id: "r1", name: "Voyageur", color: "#8c73ff" },
      { id: "r2", name: "Vétéran", color: "#ffbf4d" },
    ],
    blocks: [
      { id: "bl1", name: "Diamant", icon: "💎", qty: 342 },
      { id: "bl2", name: "Fer", icon: "🔩", qty: 1280 },
      { id: "bl3", name: "Émeraude", icon: "🟢", qty: 64 },
      { id: "bl4", name: "Redstone", icon: "🔴", qty: 512 },
    ],
    items: [
      { id: "it1", name: "Épée en diamant (Tranchant IV)", icon: "🗡️", qty: 1 },
      { id: "it2", name: "Élytres", icon: "🪽", qty: 1 },
      { id: "it3", name: "Totem d'immortalité", icon: "🌀", qty: 3 },
      { id: "it4", name: "Carte au trésor", icon: "🗺️", qty: 2 },
    ],
  },
  srv3: {
    roles: [{ id: "r3", name: "Ami de la maison", color: "#5ee6d0" }],
    blocks: [{ id: "bl5", name: "Bois de chêne", icon: "🪵", qty: 900 }],
    items: [{ id: "it5", name: "Outils en fer (lot)", icon: "🧰", qty: 1 }],
  },
  srv6: {
    roles: [{ id: "r4", name: "Aventurier+", color: "#ff5d73" }],
    blocks: [{ id: "bl6", name: "Cristal de donjon", icon: "🔮", qty: 12 }],
    items: [{ id: "it6", name: "Clé de donjon (rare)", icon: "🗝️", qty: 2 }],
  },
});
