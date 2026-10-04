import { reactive } from "vue";

export const marketByServer = reactive({
  srv1: [
    { id: "m1", type: "vente", item: "Épée d'ender +3", icon: "🗡️", seller: "Fennwick", price: 650 },
    { id: "m2", type: "vente", item: "Stack de diamants ×12", icon: "💎", seller: "Iroko_", price: 2100 },
    { id: "m3", type: "enchere", item: "Cheval squelette apprivoisé", icon: "🐴", seller: "Solweig", price: 980, bids: 7, endsIn: "02:14:09" },
    { id: "m4", type: "enchere", item: "Carte au trésor — biome glacé", icon: "🗺️", seller: "Marëo", price: 340, bids: 3, endsIn: "00:41:52" },
  ],
  srv2: [
    { id: "m5", type: "vente", item: "Armure netherite complète", icon: "🛡️", seller: "Ptit_Ker", price: 5200 },
    { id: "m6", type: "enchere", item: "Totem d'immortalité ×2", icon: "🌀", seller: "Anouka", price: 1500, bids: 11, endsIn: "00:12:30" },
  ],
  srv5: [
    { id: "m7", type: "vente", item: "Bannière personnalisée", icon: "🏳️", seller: "Néréïde", price: 150 },
  ],
});
