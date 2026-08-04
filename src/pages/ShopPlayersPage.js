import { ref, reactive, computed } from "vue";
import { auth } from "../store/auth.js";
import { servers } from "../data/servers.js";
import { marketByServer } from "../data/shop.js";
import ServerPicker from "../components/ui/ServerPicker.js";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "vente", label: "Ventes" },
  { id: "enchere", label: "Enchères" },
];

export default {
  name: "ShopPlayersPage",
  components: { ServerPicker },
  setup() {
    const marketServerIds = Object.keys(marketByServer);
    const availableServers = computed(() => servers.filter((s) => marketServerIds.includes(s.id)));
    const selectedId = ref(availableServers.value[0]?.id || null);
    const filter = ref("all");
    const bidTargetId = ref(null);
    const bidAmount = ref(0);
    const showSellForm = ref(false);
    const sellDraft = reactive({ item: "", price: 100, type: "vente" });
    const flash = ref(null);

    const listings = computed(() => {
      const all = marketByServer[selectedId.value] || [];
      if (filter.value === "all") return all;
      return all.filter((l) => l.type === filter.value);
    });

    function buy(listing) {
      if (!auth.isAuthenticated || auth.user.pikaCoins < listing.price) return;
      auth.user.pikaCoins -= listing.price;
      auth.user.pikaCoinsHistory.unshift({
        id: "h" + Date.now(),
        label: "Achat — " + listing.item,
        delta: -listing.price,
        time: "à l'instant",
      });
      const arr = marketByServer[selectedId.value];
      const idx = arr.findIndex((l) => l.id === listing.id);
      if (idx > -1) arr.splice(idx, 1);
      flash.value = listing.item + " acheté";
      setTimeout(() => (flash.value = null), 2000);
    }

    function openBid(listing) {
      bidTargetId.value = listing.id;
      bidAmount.value = listing.price + 10;
    }
    function placeBid(listing) {
      if (!auth.isAuthenticated || bidAmount.value <= listing.price) return;
      listing.price = bidAmount.value;
      listing.bids = (listing.bids || 0) + 1;
      bidTargetId.value = null;
    }

    function submitSell() {
      if (!auth.isAuthenticated || !sellDraft.item.trim() || sellDraft.price <= 0) return;
      const arr = marketByServer[selectedId.value] || (marketByServer[selectedId.value] = []);
      arr.unshift({
        id: "m" + Date.now(),
        type: sellDraft.type,
        item: sellDraft.item.trim(),
        icon: "🎁",
        seller: auth.user.username,
        price: Number(sellDraft.price),
        bids: sellDraft.type === "enchere" ? 0 : undefined,
        endsIn: sellDraft.type === "enchere" ? "24:00:00" : undefined,
      });
      sellDraft.item = "";
      sellDraft.price = 100;
      sellDraft.type = "vente";
      showSellForm.value = false;
    }

    return {
      auth, FILTERS, availableServers, selectedId, filter, listings,
      bidTargetId, bidAmount, showSellForm, sellDraft, flash,
      buy, openBid, placeBid, submitSell,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Économie de joueurs</span>
          <h2>Shop inter-joueurs</h2>
          <p>Achetez, vendez ou enchérissez sur des objets avec d'autres joueurs, en PikaCoins.</p>
        </div>
        <button class="btn btn--primary" :disabled="!auth.isAuthenticated" @click="showSellForm = !showSellForm">
          + Mettre en vente
        </button>
      </div>

      <div class="shop-toolbar">
        <div class="shop-toolbar__picker">
          <ServerPicker v-model="selectedId" :servers="availableServers" placeholder="Choisir un serveur" />
        </div>
        <div class="market-filters">
          <button v-for="f in FILTERS" :key="f.id" :class="{ 'is-active': filter === f.id }" @click="filter = f.id">{{ f.label }}</button>
        </div>
      </div>

      <div class="balance-strip">
        <div>
          <div class="setting-row__label">Votre solde</div>
          <div class="setting-row__hint">{{ auth.isAuthenticated ? 'Prêt à négocier' : 'Connexion requise pour acheter, vendre ou enchérir' }}</div>
        </div>
        <div class="coin" style="font-size:20px;">
          <span class="coin__icon"></span>
          <span v-if="auth.isAuthenticated">{{ auth.user.pikaCoins.toLocaleString('fr-FR') }} PikaCoins</span>
          <span v-else class="mono" style="font-size:13px;color:var(--ink-3)">—</span>
        </div>
      </div>

      <div v-if="showSellForm" class="card" style="margin-bottom:24px;">
        <span class="eyebrow" style="margin-bottom:14px;">Nouvelle annonce</span>
        <div style="display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:12px; align-items:end;">
          <div class="field">
            <label>Objet</label>
            <input type="text" v-model="sellDraft.item" placeholder="Ex. Épée d'ender +2" maxlength="60" />
          </div>
          <div class="field">
            <label>Prix (PikaCoins)</label>
            <input type="number" v-model="sellDraft.price" min="1" />
          </div>
          <div class="field">
            <label>Type</label>
            <div class="select-wrap">
              <select v-model="sellDraft.type">
                <option value="vente">Vente directe</option>
                <option value="enchere">Enchère</option>
              </select>
            </div>
          </div>
          <button class="btn btn--primary" @click="submitSell">Publier</button>
        </div>
      </div>

      <p v-if="flash" class="mono" style="color:var(--lime); font-size:12.5px; margin-bottom:16px;">✓ {{ flash }}</p>

      <div v-if="!listings.length" class="empty">Aucune annonce pour le moment sur ce serveur.</div>

      <div v-else class="items-grid">
        <div class="item-card" v-for="l in listings" :key="l.id">
          <div class="item-card__art">{{ l.icon }}</div>
          <div>
            <div class="item-card__row">
              <span class="item-card__name">{{ l.item }}</span>
              <span class="badge" :class="l.type === 'enchere' ? 'badge--amber' : 'badge--brand'">{{ l.type === 'enchere' ? 'Enchère' : 'Vente' }}</span>
            </div>
            <div class="item-card__meta" style="margin-top:6px;">
              vendu par {{ l.seller }}
              <template v-if="l.type === 'enchere'"> · {{ l.bids || 0 }} enchère(s) · reste {{ l.endsIn }}</template>
            </div>
          </div>

          <div class="item-card__row">
            <span class="coin"><span class="coin__icon"></span>{{ l.price.toLocaleString('fr-FR') }}</span>
            <button v-if="l.type === 'vente'" class="btn btn--sm btn--primary" :disabled="!auth.isAuthenticated || auth.user.pikaCoins < l.price" @click="buy(l)">
              {{ !auth.isAuthenticated ? 'Connexion requise' : (auth.user.pikaCoins < l.price ? 'Solde insuffisant' : 'Acheter') }}
            </button>
            <button v-else-if="bidTargetId !== l.id" class="btn btn--sm btn--subtle" :disabled="!auth.isAuthenticated" @click="openBid(l)">Enchérir</button>
          </div>

          <div v-if="bidTargetId === l.id" style="display:flex; gap:8px;">
            <input type="number" v-model="bidAmount" :min="l.price + 1" style="background:var(--void); border:1px solid var(--line-strong); border-radius:var(--r-md); padding:8px 10px; width:100%; color:var(--ink-1);" />
            <button class="btn btn--sm btn--primary" @click="placeBid(l)">Valider</button>
          </div>
        </div>
      </div>
    </section>
  `,
};
