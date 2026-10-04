import { ref, computed, onMounted } from "vue";
import { fetchStats } from "../actions/bot.js";
import { formatNumber, formatUptime } from "../lib/format.js";
import { useAutoRefresh } from "../lib/useAutoRefresh.js";

// Statut réel : tout vient de /api/stats (le bot lui-même). Si le bot ne
// répond pas, c'est qu'il est hors ligne ou que son API interne est coupée.
export default {
  name: "StatusPage",
  setup() {
    const stats = ref(null);
    const responseMs = ref(null);
    const isReady = ref(false);
    const checkedAt = ref(null);

    async function load() {
      const debut = performance.now();
      const result = await fetchStats();
      responseMs.value = result.success ? Math.round(performance.now() - debut) : null;
      stats.value = result.success ? result.stats : null;
      checkedAt.value = new Date();
      isReady.value = true;
    }

    onMounted(load);
    useAutoRefresh(load);

    const online = computed(() => stats.value !== null);

    const services = computed(() => {
      const s = stats.value;
      if (!s) {
        return [{ id: "bot", name: "Bot Beep", status: "down", detail: "ne répond pas" }];
      }
      const mc = s.minecraft || { configured: 0, online: 0 };
      return [
        {
          id: "gateway",
          name: "Connexion à Discord",
          status: s.pingMs == null ? "down" : s.pingMs > 400 ? "degraded" : "ok",
          detail: s.pingMs == null ? "déconnecté" : `${s.pingMs}ms`,
        },
        {
          id: "api",
          name: "API du site",
          status: responseMs.value > 1500 ? "degraded" : "ok",
          detail: `${responseMs.value}ms`,
        },
        {
          id: "db",
          name: "Base de données",
          status: s.database?.ok ? "ok" : "down",
          detail: s.database?.ok ? `${s.database.latencyMs}ms` : "erreur",
        },
        {
          id: "minecraft",
          name: "Serveurs Minecraft suivis",
          status: mc.configured === 0 || mc.online === mc.configured ? "ok" : "degraded",
          detail: mc.configured === 0
            ? "aucun serveur lié"
            : `${mc.online}/${mc.configured} en ligne`,
        },
      ];
    });

    const checkedLabel = computed(() =>
      checkedAt.value ? checkedAt.value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""
    );

    return { stats, online, isReady, services, responseMs, checkedLabel, formatNumber, formatUptime };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="status-hero">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Supervision en direct</span>
          <h2>Statut de Beep</h2>
          <p style="color:var(--ink-3); font-size:14px; margin-top:6px;">
            <template v-if="stats">Version v{{ stats.version }} · </template>
            Vérifié à {{ checkedLabel }} · mise à jour automatique toutes les 30 s
          </p>
        </div>
        <span v-if="isReady" class="status-pill" :class="online ? 'status-pill--online' : 'status-pill--offline'">
          <span class="dot dot--pulse"></span>
          {{ online ? 'Beep est en ligne' : 'Beep est hors ligne' }}
        </span>
      </div>

      <div v-if="!isReady" class="empty">Vérification du statut…</div>

      <template v-else>
        <div class="stat-tiles" v-if="stats">
          <div class="stat-tile">
            <div class="stat-tile__label"><span class="dot" style="color:var(--brand)"></span>Ping Discord</div>
            <div class="stat-tile__value stat-tile__value--brand mono">{{ stats.pingMs != null ? stats.pingMs + 'ms' : '—' }}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile__label"><span class="dot" style="color:var(--lime)"></span>En ligne depuis</div>
            <div class="stat-tile__value stat-tile__value--lime mono">{{ stats.startedAt ? formatUptime(stats.startedAt) : '—' }}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile__label"><span class="dot" style="color:var(--amber)"></span>Serveurs Discord</div>
            <div class="stat-tile__value stat-tile__value--amber mono">{{ formatNumber(stats.guilds) }}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile__label"><span class="dot" style="color:var(--cyan)"></span>Version</div>
            <div class="stat-tile__value mono" style="color:var(--cyan)">v{{ stats.version }}</div>
          </div>
        </div>

        <div class="card">
          <span class="eyebrow" style="margin-bottom:8px;">Services</span>
          <div>
            <div class="service-row" v-for="s in services" :key="s.id">
              <span style="font-size:14px; font-weight:600;">{{ s.name }}</span>
              <span class="status-pill" :class="s.status === 'ok' ? 'status-pill--online' : s.status === 'degraded' ? 'status-pill--degraded' : 'status-pill--offline'">
                <span class="dot"></span>{{ s.detail }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </section>
  `,
};
