import { ref, computed, watch } from "vue";
import { auth } from "../store/auth.js";
import { fetchMyShops, buyShopItem } from "../actions/shop.js";
import { coins } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";

// Emojis personnalisés Discord (ex. la Pokéball : "<:Pokeball:123…>") →
// image du CDN Discord ; les emojis Unicode sont affichés tels quels.
function customEmojiUrl(emoji) {
  const match = /^<(a?):\w+:(\d+)>$/.exec(emoji || "");
  return match ? `https://cdn.discordapp.com/emojis/${match[2]}.${match[1] ? "gif" : "png"}?size=64` : null;
}

export default {
  name: "ShopAdminPage",
  components: { ServerPicker },
  setup() {
    const shops = ref([]);
    const isLoading = ref(false);
    const loadError = ref(null);
    const selectedId = ref(null);

    const availableServers = computed(() => shops.value.map((s) => ({ id: s.guildId, name: s.name })));
    const shop = computed(() => shops.value.find((s) => s.guildId === selectedId.value) || null);
    const items = computed(() => shop.value?.items || []);
    const balance = computed(() => (shop.value ? shop.value.balance.money + shop.value.balance.bank : 0));

    const buyingId = ref(null);
    const justBought = ref(null);
    const feedback = ref(null); // { ok, message }

    async function load() {
      if (!auth.isAuthenticated) {
        shops.value = [];
        return;
      }
      isLoading.value = true;
      const result = await fetchMyShops();
      isLoading.value = false;
      loadError.value = result.success ? null : result.message;
      shops.value = result.shops;
      if (!shops.value.some((s) => s.guildId === selectedId.value)) {
        selectedId.value = shops.value[0]?.guildId || null;
      }
    }

    // auth.isReady passe à true après le premier /api/auth/me : on attend
    // de savoir si la personne est connectée avant de charger.
    watch(() => [auth.isReady, auth.isAuthenticated], () => auth.isReady && load(), { immediate: true });
    watch(selectedId, () => (feedback.value = null));

    function isSoldOut(item) {
      return item.quantity !== -1 && item.quantity <= 0;
    }

    async function buy(item) {
      if (buyingId.value) return;
      buyingId.value = item.id;
      feedback.value = null;
      const result = await buyShopItem(selectedId.value, item.id);
      buyingId.value = null;
      feedback.value = { ok: result.success, message: result.message };
      if (!result.success) return;

      // Met à jour le solde et le stock avec les valeurs renvoyées par le bot.
      shop.value.balance = result.balance;
      const idx = shop.value.items.findIndex((i) => i.id === item.id);
      if (idx > -1) shop.value.items[idx] = result.item;
      justBought.value = item.id;
      setTimeout(() => {
        if (justBought.value === item.id) justBought.value = null;
      }, 1600);
    }

    return {
      auth, availableServers, selectedId, items, balance, isLoading, loadError,
      buyingId, justBought, feedback, buy, isSoldOut, coins, customEmojiUrl,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Boutique officielle</span>
          <h2>Shop admin</h2>
          <p>Les articles mis en vente par les administrateurs de vos serveurs Discord avec <span class="mono">/shopadmin</span>.</p>
        </div>
      </div>

      <div v-if="!auth.isReady || isLoading" class="empty">Chargement des shops…</div>

      <div v-else-if="!auth.isAuthenticated" class="empty">
        Connectez-vous avec Discord pour voir les shops des serveurs dont vous êtes membre.
      </div>

      <div v-else-if="loadError" class="empty">{{ loadError }}</div>

      <div v-else-if="!availableServers.length" class="empty">
        Aucun shop configuré sur les serveurs où vous êtes avec Beep pour l'instant.
      </div>

      <template v-else>
        <div class="shop-toolbar">
          <div class="shop-toolbar__picker">
            <ServerPicker v-model="selectedId" :servers="availableServers" placeholder="Choisir un serveur" />
          </div>
        </div>

        <div class="balance-strip">
          <div>
            <div class="setting-row__label">Votre solde sur ce serveur</div>
            <div class="setting-row__hint">Portefeuille + banque, comme pour un achat sur Discord</div>
          </div>
          <div class="coin" style="font-size:20px;">
            <span class="coin__icon"></span>
            <span>{{ coins(balance) }} PikaCoins</span>
          </div>
        </div>

        <div v-if="feedback" class="balance-strip" :style="{ color: feedback.ok ? 'var(--lime)' : 'var(--coral)' }">
          {{ feedback.ok ? '✓' : '✕' }} {{ feedback.message }}
        </div>

        <div v-if="!items.length" class="empty">Aucun article en vente sur ce serveur pour l'instant.</div>

        <div v-else class="items-grid">
          <div class="item-card" v-for="it in items" :key="it.id">
            <div class="item-card__art">
              <img v-if="customEmojiUrl(it.emoji)" :src="customEmojiUrl(it.emoji)" alt="" style="width:32px;height:32px;" />
              <template v-else>{{ it.emoji }}</template>
            </div>
            <div>
              <div class="item-card__row">
                <span class="item-card__name">{{ it.name }}</span>
                <span class="tag">{{ it.categoryName }}</span>
              </div>
              <div class="item-card__meta" style="margin-top:6px;">
                {{ it.rarity }}
                <template v-if="it.quantity !== -1"> · stock : {{ it.quantity }}</template>
              </div>
              <span v-if="it.label" class="badge" :class="it.promo ? 'badge--coral' : 'badge--lime'" style="margin-top:8px;">
                {{ it.label }}<template v-if="it.promo"> −{{ it.promo }} %</template>
              </span>
            </div>
            <div class="item-card__row">
              <span class="coin">
                <span class="coin__icon"></span>{{ coins(it.price) }}
                <s v-if="it.price !== it.basePrice" class="mono" style="font-size:11px;color:var(--ink-3);margin-left:4px;">{{ coins(it.basePrice) }}</s>
              </span>
              <button
                class="btn btn--sm"
                :class="justBought === it.id ? 'btn--subtle' : 'btn--primary'"
                :disabled="buyingId !== null || isSoldOut(it) || balance < it.price"
                @click="buy(it)"
              >
                <template v-if="justBought === it.id">✓ Acheté</template>
                <template v-else-if="buyingId === it.id">Achat…</template>
                <template v-else-if="isSoldOut(it)">Épuisé</template>
                <template v-else-if="balance < it.price">Solde insuffisant</template>
                <template v-else>Acheter</template>
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>
  `,
};
