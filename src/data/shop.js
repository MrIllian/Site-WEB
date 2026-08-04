import { reactive } from "vue";

export const adminShopByServer = reactive({
  srv1: [
    { id: "a1", name: "Rang Voyageur", icon: "🧭", desc: "Accès /home ×3, /kit voyageur toutes les 12h.", price: 1200, category: "Rang" },
    { id: "a2", name: "Rang Bâtisseur", icon: "🏗️", desc: "WorldEdit limité, claims ×2.", price: 2600, category: "Rang" },
    { id: "a3", name: "Kit Explorateur", icon: "🎒", desc: "Boussole, carte, 8 torches, pain ×16.", price: 300, category: "Kit" },
    { id: "a4", name: "Élytres gravées", icon: "🪽", desc: "Cosmétique, ne s'use pas.", price: 4200, category: "Cosmétique" },
  ],
  srv3: [
    { id: "a5", name: "Rang Ami de la maison", icon: "🏡", desc: "Accès à la zone créative partagée.", price: 400, category: "Rang" },
    { id: "a6", name: "Kit Bricoleur", icon: "🧰", desc: "Outils en fer enchantés basiques.", price: 250, category: "Kit" },
  ],
  srv6: [
    { id: "a7", name: "Rang Aventurier+", icon: "⚔️", desc: "Slot de donjon supplémentaire.", price: 1800, category: "Rang" },
  ],
});

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
