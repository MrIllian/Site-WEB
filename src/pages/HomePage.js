import { computed, ref, onMounted } from "vue";
import Marquee from "../components/ui/Marquee.js";
import { bot, ticker } from "../data/bot.js";
import { useAutoRefresh } from "../lib/useAutoRefresh.js";
import { botProfile } from "../store/botProfile.js";
import { formatDate, formatNumber, formatUptime } from "../lib/format.js";
import { fetchStats } from "../actions/bot.js";

export default {
  name: "HomePage",
  components: { Marquee },
  setup() {
    const profile = computed(() => botProfile.profile);
    const displayName = computed(() => profile.value?.username || bot.name);
    const displayHandle = computed(() => (profile.value?.discriminator ? `#${profile.value.discriminator}` : null));
    const displayBio = computed(() => profile.value?.description || bot.bio);
    const displayVersion = computed(() => (profile.value?.version ? `Bêta v${profile.value.version}` : bot.version));
    const displayCreatedAt = computed(() => formatDate(profile.value?.createdAt || "2026-05-20"));
    const bannerStyle = computed(() =>
      profile.value?.banner ? { backgroundImage: `url(${profile.value.banner})`, backgroundSize: "cover", backgroundPosition: "center" } : {}
    );

    // Statistiques réelles du bot (/api/stats). Tant qu'elles ne sont pas
    // chargées — ou si le bot est injoignable — on affiche « — » plutôt
    // que des chiffres inventés.
    const liveStats = ref(null);
    async function loadStats() {
      const result = await fetchStats();
      if (result.success) liveStats.value = result.stats;
    }
    onMounted(loadStats);
    useAutoRefresh(loadStats);

    const stats = computed(() => {
      const s = liveStats.value;
      return [
        { label: "serveurs", value: s ? formatNumber(s.guilds) : "—" },
        { label: "membres", value: s ? formatNumber(s.members) : "—" },
        { label: "commandes", value: s ? formatNumber(s.commands) : "—" },
        { label: "en ligne depuis", value: s?.startedAt ? formatUptime(s.startedAt) : "—" },
      ];
    });

    const tickerItems = computed(() => {
      const s = liveStats.value;
      if (!s) return ticker;
      const live = [`beep veille sur ${formatNumber(s.guilds)} serveurs discord`];
      if (s.publicServers) live.push(`${formatNumber(s.publicServers)} serveurs minecraft dans le classement public`);
      if (s.pingMs != null) live.push(`ping discord actuel : ${s.pingMs}ms`);
      return [...live, ...ticker];
    });

    return { bot, stats, tickerItems, profile, displayName, displayHandle, displayBio, displayVersion, displayCreatedAt, bannerStyle };
  },
  template: /* html */ `
    <section class="hero wrap">
      <div class="hero__grid">
        <div>
          <span class="eyebrow">Bot Discord · Serveurs Minecraft</span>
          <h1 class="hero__title">Beep garde un œil<br/>sur vos serveurs.</h1>
          <p class="hero__lead">
            Whitelist, classements, shops, économie de joueurs et supervision en direct —
            tout se pilote depuis Discord, et se consulte ici.
          </p>
          <div class="hero__cta">
            <a href="/api/invite" class="btn btn--primary">Inviter Beep sur mon serveur</a>
            <router-link to="/serveurs" class="btn btn--ghost">Voir le classement</router-link>
          </div>
          <div class="hero__stats">
            <div v-for="s in stats" :key="s.label" class="hero__stat">
              <div class="hero__stat-value mono">{{ s.value }}</div>
              <div class="hero__stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <div class="profile-card bracketed">
          <div class="profile-card__banner" :style="bannerStyle"></div>
          <div class="profile-card__body">
            <div class="profile-card__avatar">
              <img v-if="profile && profile.avatar" :src="profile.avatar" class="profile-card__avatar-img" alt="" />
              <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="12" r="2" fill="currentColor"/><circle cx="15.5" cy="12" r="2" fill="currentColor"/></svg>
              <span class="profile-card__status"></span>
            </div>
            <div class="profile-card__name">{{ displayName }} <span class="mono" style="font-size:12px;color:var(--ink-3);font-weight:400;">BOT</span></div>
            <div class="profile-card__handle mono">{{ displayHandle || bot.tag }}</div>
            <p class="profile-card__bio">{{ displayBio }}</p>
            <div class="profile-card__divider"></div>
            <div class="profile-card__row">
              <span class="eyebrow" style="font-size:10.5px;">Créé le</span>
              <span class="mono" style="font-size:12.5px;color:var(--ink-2)">{{ displayCreatedAt }}</span>
            </div>
            <div class="profile-card__row">
              <span class="eyebrow" style="font-size:10.5px;">Version</span>
              <span class="badge badge--brand">{{ displayVersion }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Marquee :items="tickerItems" />
  `,
};
