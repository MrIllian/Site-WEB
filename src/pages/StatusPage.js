import { computed } from "vue";
import { beepStatus } from "../data/status.js";
import { bot } from "../data/bot.js";
import { botProfile } from "../store/botProfile.js";

export default {
  name: "StatusPage",
  setup() {
    const displayVersion = computed(() => (botProfile.profile?.version ? `v${botProfile.profile.version}` : bot.version));
    return { beepStatus, bot, displayVersion };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div class="status-hero">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Supervision en direct</span>
          <h2>Statut de Beep</h2>
          <p style="color:var(--ink-3); font-size:14px; margin-top:6px;">Dernier redémarrage {{ beepStatus.lastRestart }} · {{ displayVersion }}</p>
        </div>
        <span class="status-pill" :class="beepStatus.online ? 'status-pill--online' : 'status-pill--offline'">
          <span class="dot dot--pulse"></span>
          {{ beepStatus.online ? 'Beep est en ligne' : 'Beep est hors ligne' }}
        </span>
      </div>

      <div class="stat-tiles">
        <div class="stat-tile">
          <div class="stat-tile__label"><span class="dot" style="color:var(--brand)"></span>Ping Discord</div>
          <div class="stat-tile__value stat-tile__value--brand mono">{{ beepStatus.discordPing }}ms</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label"><span class="dot" style="color:var(--lime)"></span>Latence API</div>
          <div class="stat-tile__value stat-tile__value--lime mono">{{ beepStatus.apiLatency }}ms</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label"><span class="dot" style="color:var(--amber)"></span>Disponibilité (30j)</div>
          <div class="stat-tile__value stat-tile__value--amber mono">{{ beepStatus.uptime30d }}%</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__label"><span class="dot" style="color:var(--cyan)"></span>Version</div>
          <div class="stat-tile__value mono" style="color:var(--cyan)">{{ displayVersion }}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:32px;">
        <span class="eyebrow" style="margin-bottom:8px;">Services</span>
        <div>
          <div class="service-row" v-for="s in beepStatus.services" :key="s.id">
            <span style="font-size:14px; font-weight:600;">{{ s.name }}</span>
            <span class="status-pill" :class="s.status === 'ok' ? 'status-pill--online' : s.status === 'degraded' ? 'status-pill--degraded' : 'status-pill--offline'">
              <span class="dot"></span>{{ s.detail }}
            </span>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Historique</span>
          <h2 style="font-size:22px;">Incidents récents</h2>
        </div>
      </div>
      <div class="card">
        <div class="incident" v-for="i in beepStatus.incidents" :key="i.id">
          <div class="incident__title">{{ i.title }}</div>
          <p style="font-size:13px; color:var(--ink-2); line-height:1.6;">{{ i.body }}</p>
          <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <span class="mono" style="font-size:11.5px; color:var(--ink-3);">{{ i.date }}</span>
            <span class="badge badge--lime" v-if="i.resolved">Résolu</span>
          </div>
        </div>
        <div v-if="!beepStatus.incidents.length" class="empty">Aucun incident récent. Tout fonctionne normalement.</div>
      </div>
    </section>
  `,
};
