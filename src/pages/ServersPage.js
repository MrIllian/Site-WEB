import { ref, reactive, computed, watch } from "vue";
import { auth } from "../store/auth.js";
import { servers, rankedServers } from "../data/servers.js";
import { voteServer, saveServerSettings, addServerComment } from "../actions/servers.js";
import { initials } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";
import VoteControl from "../components/ui/VoteControl.js";
import Podium from "../components/ui/Podium.js";
import Toggle from "../components/ui/Toggle.js";

function cloneDraft(s) {
  return { name: s.name, ip: s.ip, port: s.port, description: s.description, tags: [...s.tags], isPublic: s.isPublic };
}

export default {
  name: "ServersPage",
  components: { ServerPicker, VoteControl, Podium, Toggle },
  setup() {
    const adminServers = computed(() => servers.filter((s) => auth.adminServerIds.includes(s.id)));
    const selectedId = ref(adminServers.value[0]?.id || null);
    const draft = reactive({ name: "", ip: "", port: 25565, description: "", tags: [], isPublic: false });
    const newTag = ref("");
    const saving = ref(false);
    const savedFlash = ref(false);
    const saveError = ref("");

    function loadDraft(id) {
      const s = servers.find((x) => x.id === id);
      if (!s) return;
      Object.assign(draft, cloneDraft(s));
      saveError.value = "";
    }
    watch(selectedId, loadDraft, { immediate: true });
    watch(adminServers, (list) => {
      if (!selectedId.value && list.length) selectedId.value = list[0].id;
    });

    function addTag() {
      const t = newTag.value.trim();
      if (!t || draft.tags.length >= 6 || draft.tags.includes(t)) return;
      draft.tags.push(t);
      newTag.value = "";
    }
    function removeTag(t) {
      draft.tags = draft.tags.filter((x) => x !== t);
    }
    async function save() {
      if (!selectedId.value || saving.value) return;
      saving.value = true;
      saveError.value = "";
      const result = await saveServerSettings(selectedId.value, draft);
      saving.value = false;
      if (!result.success) {
        saveError.value = result.message;
        return;
      }
      savedFlash.value = true;
      setTimeout(() => (savedFlash.value = false), 2200);
    }
    function resetDraft() {
      loadDraft(selectedId.value);
    }

    const ranked = computed(() => rankedServers());
    const top3 = computed(() => ranked.value.slice(0, 3));
    const rest = computed(() => ranked.value.slice(3));
    const expandedId = ref(null);
    const newComment = ref("");

    function toggleExpand(id) {
      expandedId.value = expandedId.value === id ? null : id;
      newComment.value = "";
    }
    function vote(server, dir) {
      voteServer(server, dir);
    }
    function submitComment(server) {
      const result = addServerComment(server, newComment.value);
      if (result.success) newComment.value = "";
    }

    return {
      auth, adminServers, selectedId, draft, newTag, saving, savedFlash, saveError,
      addTag, removeTag, save, resetDraft, initials,
      ranked, top3, rest, expandedId, newComment,
      toggleExpand, vote, submitComment,
    };
  },
  template: /* html */ `
    <section class="wrap servers-layout">
      <aside class="admin-panel">
        <div class="card bracketed">
          <span class="eyebrow" style="margin-bottom:16px;">Gestion serveur</span>

          <div v-if="!auth.isAuthenticated" class="auth-gate">
            <p style="font-size:13.5px; color:var(--ink-2);">Connectez-vous avec Discord pour gérer les serveurs sur lesquels vous êtes administrateur.</p>
            <span class="demo-note">nécessite une connexion Discord</span>
          </div>

          <div v-else-if="!adminServers.length" class="auth-gate">
            <p style="font-size:13.5px; color:var(--ink-2);">Beep ne vous trouve administrateur d'aucun serveur pour l'instant.</p>
          </div>

          <div v-else style="display:flex; flex-direction:column; gap:18px;">
            <ServerPicker v-model="selectedId" :servers="adminServers" placeholder="Choisir un serveur" />

            <div class="server-detail" v-if="selectedId">
              <div class="field">
                <label>Nom</label>
                <input type="text" v-model="draft.name" maxlength="40" />
              </div>
              <div class="field" style="flex-direction:row; gap:10px; margin-top:14px;">
                <div class="field" style="flex:2;">
                  <label>Adresse IP</label>
                  <input type="text" v-model="draft.ip" placeholder="play.exemple.fr" />
                </div>
                <div class="field" style="flex:1;">
                  <label>Port</label>
                  <input type="number" v-model="draft.port" placeholder="25565" />
                </div>
              </div>
              <div class="field" style="margin-top:14px;">
                <label>Description</label>
                <textarea v-model="draft.description" maxlength="220" rows="3"></textarea>
              </div>
              <div class="field" style="margin-top:14px;">
                <label>Tags ({{ draft.tags.length }}/6)</label>
                <div class="tag-input-row">
                  <span class="tag-chip" v-for="t in draft.tags" :key="t">
                    {{ t }}
                    <button type="button" @click="removeTag(t)" aria-label="Retirer">✕</button>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ajouter un tag et appuyer sur Entrée"
                  v-model="newTag"
                  @keydown.enter.prevent="addTag"
                  :disabled="draft.tags.length >= 6"
                  style="margin-top:8px;"
                />
              </div>

              <div class="field field--row" style="margin-top:18px; padding-top:16px; border-top:1px solid var(--line);">
                <div>
                  <div class="setting-row__label" style="font-size:13.5px;">Visible publiquement</div>
                  <div class="setting-row__hint">Apparaît dans le classement si activé</div>
                </div>
                <Toggle v-model="draft.isPublic" />
              </div>

              <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn btn--primary btn--block" :disabled="saving" @click="save">
                  {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
                <button class="btn btn--ghost" @click="resetDraft" :disabled="saving">Annuler</button>
              </div>
              <p v-if="saveError" class="mono" style="color:var(--coral); font-size:12px; margin-top:10px;">{{ saveError }}</p>
              <p v-else-if="savedFlash" class="mono" style="color:var(--lime); font-size:12px; margin-top:10px;">✓ modifications enregistrées</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="leaderboard">
        <div class="section-head">
          <div>
            <span class="eyebrow" style="margin-bottom:10px;">Classement communautaire</span>
            <h2>Serveurs Minecraft</h2>
            <p>{{ ranked.length }} serveurs publics suivis par Beep, classés par votes de la communauté.</p>
          </div>
        </div>

        <Podium :top3="top3" />

        <div class="card card--flush">
          <div style="padding: 6px 10px;">
            <template v-for="(s, i) in rest" :key="s.id">
              <div
                class="rank-row"
                role="button"
                tabindex="0"
                style="width:100%; text-align:left; cursor:pointer;"
                @click="toggleExpand(s.id)"
                @keydown.enter="toggleExpand(s.id)"
              >
                <span class="rank-row__num">{{ i + 4 }}</span>
                <span class="rank-row__icon">{{ initials(s.name) }}</span>
                <span class="rank-row__meta">
                  <span class="rank-row__title">{{ s.name }}</span>
                  <div class="rank-row__sub">{{ s.ip }}:{{ s.port }} · {{ s.online ? s.players.now + ' en ligne' : 'hors ligne' }}</div>
                </span>
                <VoteControl
                  :upvotes="s.upvotes" :downvotes="s.downvotes" :user-vote="s.userVote"
                  :disabled="!auth.isAuthenticated"
                  @vote="(d) => vote(s, d)"
                  @click.stop
                />
                <span class="server-picker__caret" :style="{ transform: expandedId === s.id ? 'rotate(225deg)' : 'rotate(45deg)' }"></span>
              </div>

              <div v-if="expandedId === s.id" class="server-expanded">
                <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">{{ s.description }}</p>
                <div class="server-expanded__tags">
                  <span class="tag" v-for="t in s.tags" :key="t">{{ t }}</span>
                </div>

                <div class="eyebrow" style="margin-bottom:10px;">{{ s.comments.length }} commentaire{{ s.comments.length === 1 ? '' : 's' }}</div>
                <div v-if="s.comments.length">
                  <div class="comment" v-for="c in s.comments" :key="c.id">
                    <span class="comment__avatar">{{ initials(c.author) }}</span>
                    <div>
                      <span class="comment__name">{{ c.author }}</span>
                      <span class="comment__time"> · {{ c.time }}</span>
                      <p class="comment__body">{{ c.body }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="empty" style="padding:16px 0;">Aucun commentaire pour l'instant.</p>

                <form class="server-comment-form" @submit.prevent="submitComment(s)">
                  <input
                    type="text"
                    :disabled="!auth.isAuthenticated"
                    v-model="newComment"
                    :placeholder="auth.isAuthenticated ? 'Partager votre expérience sur ce serveur…' : 'Connectez-vous pour commenter'"
                  />
                  <button class="btn btn--subtle btn--sm" type="submit" :disabled="!auth.isAuthenticated">Publier</button>
                </form>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  `,
};
