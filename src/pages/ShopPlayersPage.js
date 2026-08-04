import { ref, reactive, computed } from "vue";
import { auth } from "../store/auth.js";
import { servers } from "../data/servers.js";
import { marketByServer } from "../data/shop.js";
import { buyMarketListing, placeBid as placeBidAction, createListing } from "../actions/shop.js";
import { coins } from "../lib/format.js";
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
    const sellError = ref("");

    const listings = computed(() => {
      const all = marketByServer[selectedId.value] || [];
      if (filter.value === "all") return all;
      return all.filter((l) => l.type === filter.value);
    });

    function buy(listing) {
      const result = buyMarketListing(selectedId.value, listing);
      if (!result.success) return;
      flash.value = listing.item + " acheté";
      setTimeout(() => (flash.value = null), 2000);
    }

    function openBid(listing) {
      bidTargetId.value = listing.id;
      bidAmount.value = listing.price + 10;
    }
    function submitBid(listing) {
      const result = placeBidAction(listing, Number(bidAmount.value));
      if (result.success) bidTargetId.value = null;
    }

    function submitSell() {
      const result = createListing(selectedId.value, sellDraft);
      if (!result.success) {
        sellError.value = result.message;
        return;
      }
      sellError.value = "";
      sellDraft.item = "";
      sellDraft.price = 100;
      sellDraft.type = "vente";
      showSellForm.value = false;
    }

    return {
      auth, FILTERS, availableServers, selectedId, filter, listings,
      bidTargetId, bidAmount, showSellForm, sellDraft, flash, sellError, coins,
      buy, openBid, submitBid, submitSell,
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
          <span v-if="auth.isAuthenticated">{{ coins(auth.user.pikaCoins) }} PikaCoins</span>
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
        <p v-if="sellError" class="mono" style="color:var(--coral); font-size:12px; margin-top:10px;">{{ sellError }}</p>
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
            <span class="coin"><span class="coin__icon"></span>{{ coins(l.price) }}</span>
            <button v-if="l.type === 'vente'" class="btn btn--sm btn--primary" :disabled="!auth.isAuthenticated || auth.user.pikaCoins < l.price" @click="buy(l)">
              {{ !auth.isAuthenticated ? 'Connexion requise' : (auth.user.pikaCoins < l.price ? 'Solde insuffisant' : 'Acheter') }}
            </button>
            <button v-else-if="bidTargetId !== l.id" class="btn btn--sm btn--subtle" :disabled="!auth.isAuthenticated" @click="openBid(l)">Enchérir</button>
          </div>

          <div v-if="bidTargetId === l.id" style="display:flex; gap:8px;">
            <input type="number" v-model="bidAmount" :min="l.price + 1" style="background:var(--void); border:1px solid var(--line-strong); border-radius:var(--r-md); padding:8px 10px; width:100%; color:var(--ink-1);" />
            <button class="btn btn--sm btn--primary" @click="submitBid(l)">Valider</button>
          </div>
        </div>
      </div>
    </section>
  `,
};
