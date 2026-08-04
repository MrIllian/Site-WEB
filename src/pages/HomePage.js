import Marquee from "../components/ui/Marquee.js";
import { bot, news, ticker } from "../data/bot.js";

export default {
  name: "HomePage",
  components: { Marquee },
  setup() {
    return { bot, news, ticker };
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
            <a href="#" class="btn btn--primary">Inviter Beep sur mon serveur</a>
            <router-link to="/serveurs" class="btn btn--ghost">Voir le classement</router-link>
          </div>
          <div class="hero__stats">
            <div v-for="s in bot.stats" :key="s.label" class="hero__stat">
              <div class="hero__stat-value mono">{{ s.value }}{{ s.suffix }}</div>
              <div class="hero__stat-label">{{ s.label }}</div>
            </div>
          </div>
        </div>

        <div class="profile-card bracketed">
          <div class="profile-card__banner"></div>
          <div class="profile-card__body">
            <div class="profile-card__avatar">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="12" r="2" fill="currentColor"/><circle cx="15.5" cy="12" r="2" fill="currentColor"/></svg>
              <span class="profile-card__status"></span>
            </div>
            <div class="profile-card__name">Beep <span class="mono" style="font-size:12px;color:var(--ink-3);font-weight:400;">BOT</span></div>
            <div class="profile-card__handle mono">{{ bot.tag }} — {{ bot.version }}</div>
            <p class="profile-card__bio">{{ bot.bio }}</p>
            <div class="profile-card__divider"></div>
            <div class="profile-card__row">
              <span class="eyebrow" style="font-size:10.5px;">Membre depuis</span>
              <span class="mono" style="font-size:12.5px;color:var(--ink-2)">janv. 2022</span>
            </div>
            <div class="profile-card__row">
              <span class="eyebrow" style="font-size:10.5px;">Version</span>
              <span class="badge badge--brand">{{ bot.version }} {{ bot.codename }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Marquee :items="ticker" />

    <section class="wrap" style="padding-block:80px;">
      <div class="section-head">
        <div>
          <span class="eyebrow" style="margin-bottom:10px;">Journal</span>
          <h2>Actus de Beep</h2>
        </div>
      </div>
      <div class="news-grid">
        <article v-for="n in news" :key="n.id" class="card news-card bracketed">
          <div class="news-card__top">
            <span class="badge" :class="n.tag === 'NOUVEAU' ? 'badge--lime' : n.tag === 'FIX' ? 'badge--coral' : 'badge--brand'">{{ n.tag }}</span>
            <time class="mono" style="font-size:11.5px;color:var(--ink-3)">{{ n.date }}</time>
          </div>
          <h3 class="news-card__title">{{ n.title }}</h3>
          <p class="news-card__body">{{ n.body }}</p>
        </article>
      </div>
    </section>
  `,
};
