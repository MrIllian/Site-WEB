import { ref, computed } from "vue";
import { auth } from "../store/auth.js";
import { servers } from "../data/servers.js";
import { adminShopByServer } from "../data/shop.js";
import { buyAdminItem } from "../actions/shop.js";
import { coins } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";

export default {
  name: "ShopAdminPage",
  components: { ServerPicker },
  setup() {
    const shopServerIds = Object.keys(adminShopByServer);
    const availableServers = computed(() => servers.filter((s) => shopServerIds.includes(s.id)));
    const selectedId = ref(availableServers.value[0]?.id || null);
    const items = computed(() => adminShopByServer[selectedId.value] || []);
    const justBought = ref(null);

    function buy(item) {
      const result = buyAdminItem(item);
      if (!result.success) return;
      justBought.value = item.id;
      setTimeout(() => {
        if (justBought.value === item.id) justBought.value = null;
      }, 1600);
    }

    return { auth, availableServers, selectedId, items, justBought, buy, coins };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Boutique officielle</span>
          <h2>Shop admin</h2>
          <p>Rangs, kits et cosmétiques mis en vente par les administrateurs de chaque serveur.</p>
        </div>
      </div>

      <div class="shop-toolbar">
        <div class="shop-toolbar__picker">
          <ServerPicker v-model="selectedId" :servers="availableServers" placeholder="Choisir un serveur" />
        </div>
      </div>

      <div class="balance-strip">
        <div>
          <div class="setting-row__label">Votre solde</div>
          <div class="setting-row__hint">Utilisable sur tous les serveurs suivis par Beep</div>
        </div>
        <div class="coin" style="font-size:20px;">
          <span class="coin__icon"></span>
          <span v-if="auth.isAuthenticated">{{ coins(auth.user.pikaCoins) }} PikaCoins</span>
          <span v-else class="mono" style="font-size:13px;color:var(--ink-3)">connectez-vous pour voir votre solde</span>
        </div>
      </div>

      <div v-if="!items.length" class="empty">Aucun shop configuré pour ce serveur pour l'instant.</div>

      <div v-else class="items-grid">
        <div class="item-card" v-for="it in items" :key="it.id">
          <div class="item-card__art">{{ it.icon }}</div>
          <div>
            <div class="item-card__row">
              <span class="item-card__name">{{ it.name }}</span>
              <span class="tag">{{ it.category }}</span>
            </div>
            <div class="item-card__meta" style="margin-top:6px;">{{ it.desc }}</div>
          </div>
          <div class="item-card__row">
            <span class="coin"><span class="coin__icon"></span>{{ coins(it.price) }}</span>
            <button
              class="btn btn--sm"
              :class="justBought === it.id ? 'btn--subtle' : 'btn--primary'"
              :disabled="!auth.isAuthenticated || auth.user.pikaCoins < it.price"
              @click="buy(it)"
            >
              <template v-if="justBought === it.id">✓ Acheté</template>
              <template v-else-if="!auth.isAuthenticated">Connexion requise</template>
              <template v-else-if="auth.user.pikaCoins < it.price">Solde insuffisant</template>
              <template v-else>Acheter</template>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
};
