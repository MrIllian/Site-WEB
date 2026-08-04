import { auth, authActions } from "../store/auth.js";
import { accentOptions } from "../data/profile.js";
import { setAccent, toggleSetting } from "../actions/profile.js";
import { coins } from "../lib/format.js";

export default {
  name: "ProfilePage",
  setup() {
    return { auth, authActions, accentOptions, setAccent, toggleSetting, coins };
  },
  template: /* html */ `
    <section class="wrap" style="padding-block:48px 90px;">
      <div v-if="!auth.isAuthenticated" class="auth-gate" style="max-width:520px; margin-inline:auto; margin-top:40px;">
        <span class="eyebrow">Profil</span>
        <h2 style="font-size:24px;">Connectez-vous pour voir votre profil</h2>
        <p style="color:var(--ink-2); font-size:14px;">Votre carte d'identité, votre solde de PikaCoins et vos préférences apparaîtront ici une fois connecté avec Discord.</p>
        <button class="btn btn--discord" :disabled="auth.isLoading" @click="authActions.login">
          {{ auth.isLoading ? 'Connexion…' : 'Se connecter avec Discord' }}
        </button>
      </div>

      <div v-else class="profile-layout">
        <aside class="id-card bracketed" style="--corner-color: var(--brand);">
          <div class="id-card__banner"></div>
          <div class="id-card__body">
            <div class="id-card__avatar">{{ auth.user.initials }}</div>
            <h3 style="margin-top:14px; font-size:19px;">{{ auth.user.username }}</h3>
            <div class="mono" style="font-size:12px; color:var(--ink-3); margin-top:2px;">@{{ auth.user.discriminator }}</div>
            <p style="font-size:13px; color:var(--ink-2); margin-top:14px; line-height:1.6;">{{ auth.user.settings.bio }}</p>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:16px;" v-if="auth.user.settings.showBadges">
              <span class="badge" :class="'badge--' + b.tone" v-for="b in auth.user.badges" :key="b.id">{{ b.label }}</span>
            </div>
            <div style="border-top:1px solid var(--line); margin-top:18px; padding-top:14px; display:flex; justify-content:space-between;">
              <span class="eyebrow" style="font-size:10.5px;">Membre depuis</span>
              <span class="mono" style="font-size:12.5px; color:var(--ink-2);">{{ auth.user.memberSince }}</span>
            </div>
            <button class="btn btn--ghost btn--block btn--sm" style="margin-top:18px;" @click="authActions.logout">Se déconnecter</button>
          </div>
        </aside>

        <div>
          <div class="card bracketed">
            <span class="eyebrow" style="margin-bottom:16px;">PikaCoins</span>
            <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:24px;">
              <span class="coin" style="font-size:36px;"><span class="coin__icon" style="width:26px;height:26px;"></span>{{ coins(auth.user.pikaCoins) }}</span>
              <span class="mono" style="font-size:12.5px; color:var(--ink-3);">solde disponible</span>
            </div>
            <div class="eyebrow" style="margin-bottom:10px;">Activité récente</div>
            <div class="coin-history">
              <div class="coin-row" v-for="h in auth.user.pikaCoinsHistory" :key="h.id">
                <div>
                  <div class="coin-row__label">{{ h.label }}</div>
                  <div class="coin-row__time">{{ h.time }}</div>
                </div>
                <span class="mono" :style="{ color: h.delta > 0 ? 'var(--lime)' : 'var(--coral)' }">{{ h.delta > 0 ? '+' : '' }}{{ coins(h.delta) }}</span>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:20px;">
            <span class="eyebrow" style="margin-bottom:6px;">Personnalisation</span>
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
                  <div class="setting-row__hint">Visibles sur votre carte d'identité publique</div>
                </div>
                <label class="toggle">
                  <button type="button" role="switch" :aria-checked="auth.user.settings.showBadges" class="toggle__track" :class="{ 'is-on': auth.user.settings.showBadges }" @click="toggleSetting('showBadges')"
                    <span class="toggle__thumb"></span>
                  </button>
                </label>
              </div>
              <div class="setting-row">
                <div>
                  <div class="setting-row__label">Profil public</div>
                  <div class="setting-row__hint">Visible par les autres membres sur le classement</div>
                </div>
                <label class="toggle">
                  <button type="button" role="switch" :aria-checked="auth.user.settings.publicProfile" class="toggle__track" :class="{ 'is-on': auth.user.settings.publicProfile }" @click="toggleSetting('publicProfile')"
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
