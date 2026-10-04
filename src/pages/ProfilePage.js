import { ref, computed, watch } from "vue";
import { auth, authActions } from "../store/auth.js";
import { accentOptions } from "../data/profile.js";
import { setAccent, toggleSetting } from "../actions/profile.js";
import { fetchMyInventory } from "../actions/inventory.js";
import { coins, formatDate } from "../lib/format.js";
import { useAutoRefresh } from "../lib/useAutoRefresh.js";

// Date de création d'un compte Discord, lue directement dans son id
// (les ids Discord sont des « snowflakes » qui contiennent l'horodatage).
function discordCreatedAt(id) {
  try {
    return new Date(Number((BigInt(id) >> 22n) + 1420070400000n)).toISOString();
  } catch {
    return null;
  }
}

export default {
  name: "ProfilePage",
  setup() {
    const servers = ref([]);
    const isLoading = ref(false);
    const loadError = ref(null);

    async function load() {
      if (!auth.isAuthenticated) return;
      isLoading.value = !servers.value.length;
      const result = await fetchMyInventory();
      isLoading.value = false;
      loadError.value = result.success ? null : result.message;
      if (result.success) servers.value = result.servers;
    }

    watch(() => [auth.isReady, auth.isAuthenticated], () => auth.isReady && load(), { immediate: true });
    useAutoRefresh(load);

    const withEconomy = computed(() => servers.value.filter((s) => s.hasAccount));
    const total = computed(() => withEconomy.value.reduce((n, s) => n + s.balance.money + s.balance.bank, 0));

    // Badges et titres gagnés dans Beep, tous serveurs confondus.
    function collect(key) {
      const seen = new Map();
      for (const s of servers.value) {
        const cat = s.categories.find((c) => c.key === key);
        for (const it of cat?.items || []) {
          if (!seen.has(it.name)) seen.set(it.name, { name: it.name, servers: [] });
          seen.get(it.name).servers.push(s.name);
        }
      }
      return [...seen.values()];
    }
    const badges = computed(() => collect("badges"));
    const titles = computed(() => collect("titles"));

    const createdAt = computed(() => (auth.user ? formatDate(discordCreatedAt(auth.user.id)) : ""));

    return {
      auth, authActions, accentOptions, setAccent, toggleSetting, coins,
      isLoading, loadError, total, withEconomy, badges, titles, createdAt,
    };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div v-if="!auth.isAuthenticated" class="auth-gate" style="max-width:520px; margin-inline:auto; margin-top:40px;">
        <span class="eyebrow">Profil</span>
        <h2 style="font-size:24px;">Connectez-vous pour voir votre profil</h2>
        <p style="color:var(--ink-2); font-size:14px;">Votre carte d'identité, vos soldes de PikaCoins par serveur et vos préférences apparaîtront ici une fois connecté avec Discord.</p>
        <button class="btn btn--discord" :disabled="auth.isLoading" @click="authActions.login">
          {{ auth.isLoading ? 'Connexion…' : 'Se connecter avec Discord' }}
        </button>
      </div>

      <div v-else class="profile-layout">
        <aside class="id-card bracketed" style="--corner-color: var(--brand);">
          <div class="id-card__banner"></div>
          <div class="id-card__body">
            <img v-if="auth.user.avatar" :src="auth.user.avatar" class="id-card__avatar id-card__avatar--img" alt="" />
            <div v-else class="id-card__avatar">{{ auth.user.initials }}</div>
            <h3 style="margin-top:14px; font-size:19px;">{{ auth.user.username }}</h3>
            <div class="mono" style="font-size:12px; color:var(--ink-3); margin-top:2px;">@{{ auth.user.handle }}</div>
            <p style="font-size:13px; color:var(--ink-2); margin-top:14px; line-height:1.6;">{{ auth.user.settings.bio }}</p>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:16px;" v-if="auth.user.settings.showBadges && (badges.length || titles.length)">
              <span class="badge badge--amber" v-for="t in titles" :key="'t' + t.name" :title="t.servers.join(', ')">🏅 {{ t.name }}</span>
              <span class="badge badge--brand" v-for="b in badges" :key="'b' + b.name" :title="b.servers.join(', ')">🎖️ {{ b.name }}</span>
            </div>
            <div style="border-top:1px solid var(--line); margin-top:18px; padding-top:14px; display:flex; justify-content:space-between;">
              <span class="eyebrow" style="font-size:10.5px;">Sur Discord depuis</span>
              <span class="mono" style="font-size:12.5px; color:var(--ink-2);">{{ createdAt }}</span>
            </div>
            <button class="btn btn--ghost btn--block btn--sm" style="margin-top:18px;" @click="authActions.logout">Se déconnecter</button>
          </div>
        </aside>

        <div>
          <div class="card bracketed">
            <span class="eyebrow" style="margin-bottom:16px;">PikaCoins</span>
            <div v-if="isLoading" class="empty">Chargement de vos soldes…</div>
            <div v-else-if="loadError" class="empty">{{ loadError }}</div>
            <template v-else>
              <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:24px; flex-wrap:wrap;">
                <span class="coin" style="font-size:36px;"><span class="coin__icon"></span>{{ coins(total) }}</span>
                <span class="mono" style="font-size:12.5px; color:var(--ink-3);">au total, portefeuille + banque</span>
              </div>
              <div class="eyebrow" style="margin-bottom:10px;">Par serveur</div>
              <div class="coin-history">
                <div class="coin-row" v-for="s in withEconomy" :key="s.guildId">
                  <div>
                    <div class="coin-row__label">{{ s.name }}</div>
                    <div class="coin-row__time">{{ coins(s.balance.money) }} en portefeuille · {{ coins(s.balance.bank) }} en banque</div>
                  </div>
                  <span class="coin"><span class="coin__icon"></span>{{ coins(s.balance.money + s.balance.bank) }}</span>
                </div>
                <div v-if="!withEconomy.length" class="empty">
                  Vous n'avez encore utilisé l'économie de Beep sur aucun serveur.
                </div>
              </div>
            </template>
          </div>

          <div class="card" style="margin-top:20px;">
            <span class="eyebrow" style="margin-bottom:6px;">Personnalisation</span>
            <p class="mono" style="font-size:11.5px; color:var(--ink-3); margin-top:4px;">Enregistrée dans ce navigateur, propre au site.</p>
            <div class="settings-grid">
              <div class="setting-row">
                <div>
                  <div class="setting-row__label">Couleur d'accent</div>
                  <div class="setting-row__hint">Utilisée sur votre carte d'identité et vos badges</div>
                </div>
                <div class="accent-swatches">
                  <button
                    v-for="a in accentOptions" :key="a.id"
                    class="accent-swatch"
                    :class="{ 'is-active': auth.user.settings.accent === a.id }"
                    :style="{ background: a.color }"
                    :aria-label="a.label"
                    @click="setAccent(a.id)"
                  ></button>
                </div>
              </div>
              <div class="setting-row">
                <div>
                  <div class="setting-row__label">Afficher mes badges</div>
                  <div class="setting-row__hint">Badges et titres gagnés sur vos serveurs, affichés sur votre carte</div>
                </div>
                <label class="toggle">
                  <button type="button" role="switch" :aria-checked="auth.user.settings.showBadges" class="toggle__track" :class="{ 'is-on': auth.user.settings.showBadges }" @click="toggleSetting('showBadges')">
                    <span class="toggle__thumb"></span>
                  </button>
                </label>
              </div>
              <div class="setting-row" style="flex-direction:column; align-items:stretch; gap:10px;">
                <div class="setting-row__label">Bio</div>
                <textarea v-model="auth.user.settings.bio" rows="2" maxlength="140" style="background:var(--void); border:1px solid var(--line-strong); border-radius:var(--r-md); padding:11px 14px; color:var(--ink-1); font-family:var(--f-body); font-size:13.5px;"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
};
