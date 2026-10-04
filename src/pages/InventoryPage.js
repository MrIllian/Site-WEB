import { ref, computed, watch } from "vue";
import { auth, authActions } from "../store/auth.js";
import { fetchMyInventory } from "../actions/inventory.js";
import { formatNumber, coins } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";

// Emojis personnalisés Discord (ex. "<:PikaCoin:123…>") → image du CDN.
function customEmojiUrl(emoji) {
  const match = /^<(a?):\w+:(\d+)>$/.exec(emoji || "");
  return match ? `https://cdn.discordapp.com/emojis/${match[2]}.${match[1] ? "gif" : "png"}?size=64` : null;
}

export default {
  name: "InventoryPage",
  components: { ServerPicker },
  setup() {
    const servers = ref([]);
    const isLoading = ref(false);
    const loadError = ref(null);
    const selectedId = ref(null);

    const availableServers = computed(() => servers.value.map((s) => ({ id: s.guildId, name: s.name })));
    const current = computed(() => servers.value.find((s) => s.guildId === selectedId.value) || null);
    const itemsCount = computed(() =>
      (current.value?.categories.find((c) => c.key === "items")?.items || []).reduce((n, i) => n + i.quantity, 0)
    );
    const isEmpty = computed(() =>
      current.value && !current.value.fish.length && current.value.categories.every((c) => !c.items.length)
    );

    async function load() {
      if (!auth.isAuthenticated) {
        servers.value = [];
        return;
      }
      isLoading.value = true;
      const result = await fetchMyInventory();
      isLoading.value = false;
      loadError.value = result.success ? null : result.message;
      servers.value = result.servers;
      if (!servers.value.some((s) => s.guildId === selectedId.value)) {
        selectedId.value = servers.value[0]?.guildId || null;
      }
    }

    watch(() => [auth.isReady, auth.isAuthenticated], () => auth.isReady && load(), { immediate: true });

    return {
      auth, authActions, availableServers, selectedId, current, itemsCount, isEmpty,
      isLoading, loadError, formatNumber, coins, customEmojiUrl,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div v-if="auth.isReady && !auth.isAuthenticated" class="auth-gate" style="max-width:520px; margin-inline:auto; margin-top:40px;">
        <span class="eyebrow">Inventaire</span>
        <h2 style="font-size:24px;">Connectez-vous pour voir votre inventaire</h2>
        <p style="color:var(--ink-2); font-size:14px;">Beep récupère vos rôles, votre solde et vos objets pour chaque serveur une fois connecté.</p>
        <button class="btn btn--discord" :disabled="auth.isLoading" @click="authActions.login">
          {{ auth.isLoading ? 'Connexion…' : 'Se connecter avec Discord' }}
        </button>
      </div>

      <template v-else>
        <div class="section-head">
          <div>
            <span class="eyebrow" style="margin-bottom:10px;">Votre profil de jeu</span>
            <h2>Inventaire</h2>
            <p>Rôles, solde et objets que Beep connaît pour vous sur le serveur sélectionné — les mêmes que sur Discord.</p>
          </div>
        </div>

        <div v-if="!auth.isReady || isLoading" class="empty">Chargement de l'inventaire…</div>

        <div v-else-if="loadError" class="empty">{{ loadError }}</div>

        <div v-else-if="!availableServers.length" class="empty">Vous n'êtes sur aucun serveur Discord où Beep est présent.</div>

        <template v-else>
          <div style="max-width:360px; margin-bottom:32px;">
            <ServerPicker v-model="selectedId" :servers="availableServers" placeholder="Choisir un serveur" />
          </div>

          <div class="balance-strip">
            <div>
              <div class="setting-row__label">Votre solde sur ce serveur</div>
              <div class="setting-row__hint">
                {{ coins(current.balance.money) }} en portefeuille · {{ coins(current.balance.bank) }} en banque
                <template v-if="!current.hasAccount"> · solde de départ, vous n'avez pas encore utilisé l'économie ici</template>
              </div>
            </div>
            <div class="coin" style="font-size:20px;">
              <span class="coin__icon"></span>
              <span>{{ coins(current.balance.money + current.balance.bank) }} PikaCoins</span>
            </div>
          </div>

          <div class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Rôles</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <span
                v-for="r in current.roles" :key="r.id" class="badge"
                :style="r.color ? { color: r.color, borderColor: r.color + '55', background: r.color + '14' } : {}"
              >{{ r.name }}</span>
              <span v-if="!current.roles.length" class="empty" style="padding:0;">Aucun rôle sur ce serveur.</span>
            </div>
          </div>

          <div v-if="current.resources.petrole || current.resources.electricite" class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Ressources</span>
            <div class="inv-grid">
              <div class="inv-tile" v-if="current.resources.petrole">
                <span class="inv-tile__icon">🛢️</span><span>Pétrole</span>
                <span class="inv-tile__qty">×{{ formatNumber(current.resources.petrole) }}</span>
              </div>
              <div class="inv-tile" v-if="current.resources.electricite">
                <span class="inv-tile__icon">⚡</span><span>Électricité</span>
                <span class="inv-tile__qty">×{{ formatNumber(current.resources.electricite) }}</span>
              </div>
            </div>
          </div>

          <div v-if="isEmpty" class="empty">Votre inventaire est vide sur ce serveur.</div>

          <template v-for="c in current.categories" :key="c.key">
            <div v-if="c.items.length" class="inv-section">
              <span class="eyebrow" style="margin-bottom:14px;">
                {{ c.name }}
                <template v-if="c.key === 'items' && current.itemsLimit"> · {{ itemsCount }}/{{ current.itemsLimit }}</template>
              </span>
              <div class="inv-grid">
                <div class="inv-tile" v-for="it in c.items" :key="it.name">
                  <span class="inv-tile__icon">
                    <img v-if="customEmojiUrl(c.emoji)" :src="customEmojiUrl(c.emoji)" alt="" style="width:22px;height:22px;" />
                    <template v-else>{{ c.emoji }}</template>
                  </span>
                  <span>{{ it.name }}</span>
                  <span v-if="c.key === 'items'" class="inv-tile__qty">×{{ formatNumber(it.quantity) }}</span>
                </div>
              </div>
            </div>
          </template>

          <div v-if="current.fish.length" class="inv-section">
            <span class="eyebrow" style="margin-bottom:14px;">Poissons</span>
            <div class="inv-grid">
              <div class="inv-tile" v-for="f in current.fish" :key="f.name">
                <span class="inv-tile__icon">🐟</span>
                <span>{{ f.name }}</span>
                <span class="inv-tile__qty">×{{ formatNumber(f.quantity) }}</span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </section>
  `,
};
