import { ref, reactive, computed, watch } from "vue";
import { auth } from "../store/auth.js";
import { fetchMyMarkets, buyListing, cancelListing, createListing } from "../actions/shop.js";
import { coins } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "mine", label: "Mes annonces" },
];

function emptyDraft() {
  return { category: "", itemName: "", quantity: 1, price: 100, rarity: "" };
}

export default {
  name: "ShopPlayersPage",
  components: { ServerPicker },
  setup() {
    const markets = ref([]);
    const isLoading = ref(false);
    const loadError = ref(null);
    const selectedId = ref(null);
    const filter = ref("all");
    const showSellForm = ref(false);
    const sellDraft = reactive(emptyDraft());
    const sellError = ref("");
    const isPublishing = ref(false);
    const busyId = ref(null);
    const feedback = ref(null); // { ok, message }

    const availableServers = computed(() => markets.value.map((m) => ({ id: m.guildId, name: m.name })));
    const market = computed(() => markets.value.find((m) => m.guildId === selectedId.value) || null);
    const balance = computed(() => (market.value ? market.value.balance.money + market.value.balance.bank : 0));

    const listings = computed(() => {
      const all = market.value?.listings || [];
      return filter.value === "mine" ? all.filter((l) => l.isMine) : all;
    });

    // Formulaire de vente : on ne peut vendre que ce qu'on possède, comme
    // sur Discord (catégorie → objet de l'inventaire → quantité/prix → rareté).
    const sellCategories = computed(() => (market.value?.inventory || []).filter((c) => c.items.length));
    const sellItems = computed(() => sellCategories.value.find((c) => c.category === sellDraft.category)?.items || []);
    const selectedOwned = computed(() => sellItems.value.find((i) => i.name === sellDraft.itemName)?.quantity || 0);

    watch(() => sellDraft.category, () => {
      sellDraft.itemName = "";
      sellDraft.quantity = 1;
    });

    async function load() {
      if (!auth.isAuthenticated) {
        markets.value = [];
        return;
      }
      isLoading.value = !markets.value.length;
      const result = await fetchMyMarkets();
      isLoading.value = false;
      loadError.value = result.success ? null : result.message;
      markets.value = result.markets;
      if (!markets.value.some((m) => m.guildId === selectedId.value)) {
        selectedId.value = markets.value[0]?.guildId || null;
      }
    }

    watch(() => [auth.isReady, auth.isAuthenticated], () => auth.isReady && load(), { immediate: true });
    watch(selectedId, () => {
      feedback.value = null;
      sellError.value = "";
      Object.assign(sellDraft, emptyDraft());
    });

    // Après chaque action on recharge depuis le bot : solde, inventaire et
    // annonces restent ainsi exactement ceux de Discord.
    async function runAction(id, action) {
      if (busyId.value) return;
      busyId.value = id;
      feedback.value = null;
      const result = await action();
      feedback.value = { ok: result.success, message: result.message };
      await load();
      busyId.value = null;
    }

    function buy(listing) {
      return runAction(listing.id, () => buyListing(selectedId.value, listing.id));
    }

    function cancel(listing) {
      return runAction(listing.id, () => cancelListing(selectedId.value, listing.id));
    }

    async function submitSell() {
      isPublishing.value = true;
      const result = await createListing(selectedId.value, sellDraft);
      isPublishing.value = false;
      if (!result.success) {
        sellError.value = result.message;
        return;
      }
      sellError.value = "";
      Object.assign(sellDraft, emptyDraft());
      showSellForm.value = false;
      feedback.value = { ok: true, message: result.message };
      await load();
    }

    return {
      auth, FILTERS, availableServers, selectedId, filter, market, balance, listings,
      isLoading, loadError, showSellForm, sellDraft, sellError, isPublishing,
      sellCategories, sellItems, selectedOwned, busyId, feedback, coins,
      buy, cancel, submitSell,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Économie de joueurs</span>
          <h2>Shop inter-joueurs</h2>
          <p>Achetez et vendez des objets de votre inventaire avec les autres membres, en PikaCoins — le même marché que <span class="mono">/market</span> sur Discord.</p>
        </div>
        <button v-if="market" class="btn btn--primary" @click="showSellForm = !showSellForm">
          {{ showSellForm ? 'Annuler' : '+ Mettre en vente' }}
        </button>
      </div>

      <div v-if="!auth.isReady || isLoading" class="empty">Chargement du marché…</div>

      <div v-else-if="!auth.isAuthenticated" class="empty">
        Connectez-vous avec Discord pour voir le marché des serveurs dont vous êtes membre.
      </div>

      <div v-else-if="loadError" class="empty">{{ loadError }}</div>

      <div v-else-if="!availableServers.length" class="empty">
        Vous n'êtes sur aucun serveur Discord où Beep est présent.
      </div>

      <template v-else>
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
            <div class="setting-row__label">Votre solde sur ce serveur</div>
            <div class="setting-row__hint">Publier une annonce coûte {{ market.listingCost }} PikaCoins (portefeuille)</div>
          </div>
          <div class="coin" style="font-size:20px;">
            <span class="coin__icon"></span>
            <span>{{ coins(balance) }} PikaCoins</span>
          </div>
        </div>

        <div v-if="showSellForm" class="card" style="margin-bottom:24px;">
          <span class="eyebrow" style="margin-bottom:14px;">Nouvelle annonce</span>

          <div v-if="!sellCategories.length" class="empty" style="padding:12px 0;">
            Votre inventaire sur ce serveur est vide : rien à mettre en vente pour l'instant.
          </div>

          <template v-else>
            <div class="sell-form-grid">
              <div class="field">
                <label>Catégorie</label>
                <div class="select-wrap">
                  <select v-model="sellDraft.category">
                    <option value="" disabled>Choisir…</option>
                    <option v-for="c in sellCategories" :key="c.category" :value="c.category">{{ c.name }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Objet</label>
                <div class="select-wrap">
                  <select v-model="sellDraft.itemName" :disabled="!sellDraft.category">
                    <option value="" disabled>Choisir…</option>
                    <option v-for="i in sellItems" :key="i.name" :value="i.name">
                      {{ i.name }}{{ sellDraft.category === 'items' ? ' ×' + i.quantity : '' }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Quantité</label>
                <input type="number" v-model="sellDraft.quantity" min="1" :max="selectedOwned || 1" :disabled="sellDraft.category !== 'items'" />
              </div>
              <div class="field">
                <label>Prix (PikaCoins)</label>
                <input type="number" v-model="sellDraft.price" min="1" />
              </div>
              <div class="field">
                <label>Rareté</label>
                <div class="select-wrap">
                  <select v-model="sellDraft.rarity">
                    <option value="" disabled>Choisir…</option>
                    <option v-for="r in market.rarities" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
              </div>
              <button class="btn btn--primary" :disabled="isPublishing" @click="submitSell">
                {{ isPublishing ? 'Publication…' : 'Publier' }}
              </button>
            </div>
          </template>
          <p v-if="sellError" class="mono" style="color:var(--coral); font-size:12px; margin-top:10px;">{{ sellError }}</p>
        </div>

        <div v-if="feedback" class="balance-strip" :style="{ color: feedback.ok ? 'var(--lime)' : 'var(--coral)' }">
          {{ feedback.ok ? '✓' : '✕' }} {{ feedback.message }}
        </div>

        <div v-if="!listings.length" class="empty">
          {{ filter === 'mine' ? "Vous n'avez aucune annonce sur ce serveur." : 'Aucune annonce pour le moment sur ce serveur.' }}
        </div>

        <div v-else class="items-grid">
          <div class="item-card" v-for="l in listings" :key="l.id">
            <div>
              <div class="item-card__row">
                <span class="item-card__name">{{ l.itemName }} <span class="mono" style="color:var(--ink-3);font-weight:400;">×{{ l.quantity }}</span></span>
                <span class="tag">{{ l.categoryName }}</span>
              </div>
              <div class="item-card__meta" style="margin-top:6px;">
                {{ l.rarity }} · {{ l.isMine ? 'votre annonce' : 'vendu par ' + l.sellerName }}
              </div>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                <span v-if="l.label" class="badge" :class="l.promo ? 'badge--coral' : 'badge--lime'">
                  {{ l.label }}<template v-if="l.promo"> −{{ l.promo }} %</template>
                </span>
                <span v-if="!l.visible" class="badge">Cachée</span>
              </div>
            </div>

            <div class="item-card__row">
              <span class="coin">
                <span class="coin__icon"></span>{{ coins(l.price) }}
                <s v-if="l.price !== l.basePrice" class="mono" style="font-size:11px;color:var(--ink-3);margin-left:4px;">{{ coins(l.basePrice) }}</s>
              </span>
              <button v-if="l.isMine" class="btn btn--sm btn--subtle" :disabled="busyId !== null" @click="cancel(l)">
                {{ busyId === l.id ? 'Retrait…' : 'Retirer' }}
              </button>
              <button v-else class="btn btn--sm btn--primary" :disabled="busyId !== null || balance < l.price" @click="buy(l)">
                <template v-if="busyId === l.id">Achat…</template>
                <template v-else-if="balance < l.price">Solde insuffisant</template>
                <template v-else>Acheter</template>
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>
  `,
};
