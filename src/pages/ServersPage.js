import { ref, reactive, computed, watch, onMounted } from "vue";
import { auth } from "../store/auth.js";
import {
  fetchPublicServers,
  fetchGuildServer,
  saveServerSettings,
  voteServer,
  addServerComment,
} from "../actions/servers.js";
import { initials, relativeTime } from "../lib/format.js";
import ServerPicker from "../components/ui/ServerPicker.js";
import VoteControl from "../components/ui/VoteControl.js";
import Podium from "../components/ui/Podium.js";
import Toggle from "../components/ui/Toggle.js";

function emptyDraft() {
  return { name: "", ip: "", port: 25565, description: "", tags: [], public: false };
}

export default {
  name: "ServersPage",
  components: { ServerPicker, VoteControl, Podium, Toggle },
  setup() {
    // ---------------- Classement public ----------------
    const ranked = ref([]);
    const loadingList = ref(true);
    const listError = ref("");

    async function loadServers() {
      loadingList.value = true;
      const result = await fetchPublicServers();
      if (result.success) {
        ranked.value = result.servers
          .slice()
          .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        listError.value = "";
      } else {
        listError.value = result.message;
      }
      loadingList.value = false;
    }
    onMounted(loadServers);

    const top3 = computed(() => ranked.value.slice(0, 3));
    const rest = computed(() => ranked.value.slice(3));
    const expandedId = ref(null);
    const newComment = ref("");
    const expandedDetail = reactive({ comments: [] });
    const loadingDetail = ref(false);

    async function toggleExpand(server) {
      newComment.value = "";
      if (expandedId.value === server.guildId) {
        expandedId.value = null;
        return;
      }
      expandedId.value = server.guildId;
      loadingDetail.value = true;
      const result = await fetchGuildServer(server.guildId);
      loadingDetail.value = false;
      expandedDetail.comments = result.success ? result.server.comments : [];
    }

    async function vote(server, dir) {
      if (!auth.isAuthenticated) return;
      const nextDirection = server.userVote === dir ? 0 : dir;
      const result = await voteServer(server.guildId, nextDirection);
      if (result.success) {
        server.upvotes = result.upvotes;
        server.downvotes = result.downvotes;
        server.userVote = result.userVote;
      }
    }

    async function submitComment(server) {
      const result = await addServerComment(server.guildId, newComment.value);
      if (result.success) {
        newComment.value = "";
        expandedDetail.comments = [result.comment, ...expandedDetail.comments];
      }
    }

    // ---------------- Panneau admin ----------------
    const adminGuilds = computed(() => auth.adminGuilds || []);
    const selectedId = ref(null);
    watch(
      adminGuilds,
      (list) => {
        if (!selectedId.value && list.length) selectedId.value = list[0].id;
      },
      { immediate: true }
    );

    const draft = reactive(emptyDraft());
    const newTag = ref("");
    const saving = ref(false);
    const savedFlash = ref(false);
    const saveError = ref("");
    const loadingDraft = ref(false);

    async function loadDraft(guildId) {
      if (!guildId) return;
      loadingDraft.value = true;
      saveError.value = "";
      const result = await fetchGuildServer(guildId);
      loadingDraft.value = false;
      if (!result.success) {
        saveError.value = result.message;
        return;
      }
      const s = result.server;
      Object.assign(draft, {
        name: s.name || "",
        ip: s.ip || "",
        port: s.port || 25565,
        description: s.description || "",
        tags: [...(s.tags || [])],
        public: !!s.public,
      });
    }
    watch(selectedId, loadDraft, { immediate: true });

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
      loadServers();
    }
    function resetDraft() {
      loadDraft(selectedId.value);
    }

    return {
      auth,
      ranked, loadingList, listError, top3, rest, expandedId, expandedDetail, loadingDetail,
      newComment, toggleExpand, vote, submitComment,
      adminGuilds, selectedId, draft, newTag, saving, savedFlash, saveError, loadingDraft,
      addTag, removeTag, save, resetDraft,
      initials, relativeTime,
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

          <div v-else-if="!adminGuilds.length" class="auth-gate">
            <p style="font-size:13.5px; color:var(--ink-2);">Beep ne vous trouve administrateur d'aucun serveur Discord pour l'instant.</p>
          </div>

          <div v-else style="display:flex; flex-direction:column; gap:18px;">
            <ServerPicker v-model="selectedId" :servers="adminGuilds" placeholder="Choisir un serveur" />

            <p v-if="loadingDraft" class="mono" style="font-size:12.5px; color:var(--ink-3);">Chargement…</p>

            <div class="server-detail" v-else-if="selectedId">
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
                <Toggle v-model="draft.public" />
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
            <p v-if="!loadingList && !listError">{{ ranked.length }} serveur{{ ranked.length === 1 ? '' : 's' }} public{{ ranked.length === 1 ? '' : 's' }} suivi{{ ranked.length === 1 ? '' : 's' }} par Beep, classé{{ ranked.length === 1 ? '' : 's' }} par votes de la communauté.</p>
          </div>
        </div>

        <p v-if="loadingList" class="empty">Chargement du classement…</p>
        <p v-else-if="listError" class="empty" style="color:var(--coral);">{{ listError }}</p>

        <template v-else>
          <Podium :top3="top3" />

          <div class="card card--flush">
            <div style="padding: 6px 10px;">
              <div v-if="!ranked.length" class="empty">Aucun serveur public pour l'instant.</div>
              <template v-for="(s, i) in rest" :key="s.guildId">
                <div
                  class="rank-row"
                  role="button"
                  tabindex="0"
                  style="width:100%; text-align:left; cursor:pointer;"
                  @click="toggleExpand(s)"
                  @keydown.enter="toggleExpand(s)"
                >
                  <span class="rank-row__num">{{ i + 4 }}</span>
                  <span class="rank-row__icon">{{ initials(s.name) }}</span>
                  <span class="rank-row__meta">
                    <span class="rank-row__title">{{ s.name }}</span>
                    <div class="rank-row__sub">{{ s.ip }}{{ s.port ? ':' + s.port : '' }} · {{ s.online ? 'en ligne' : 'hors ligne' }}</div>
                  </span>
                  <VoteControl
                    :upvotes="s.upvotes" :downvotes="s.downvotes" :user-vote="s.userVote || 0"
                    :disabled="!auth.isAuthenticated"
                    @vote="(d) => vote(s, d)"
                    @click.stop
                  />
                  <span class="server-picker__caret" :style="{ transform: expandedId === s.guildId ? 'rotate(225deg)' : 'rotate(45deg)' }"></span>
                </div>

                <div v-if="expandedId === s.guildId" class="server-expanded">
                  <p style="font-size:13.5px; color:var(--ink-2); line-height:1.6;">{{ s.description }}</p>
                  <div class="server-expanded__tags">
                    <span class="tag" v-for="t in s.tags" :key="t">{{ t }}</span>
                  </div>

                  <p v-if="loadingDetail" class="mono" style="font-size:12px; color:var(--ink-3);">Chargement des commentaires…</p>
                  <template v-else>
                    <div class="eyebrow" style="margin-bottom:10px;">{{ expandedDetail.comments.length }} commentaire{{ expandedDetail.comments.length === 1 ? '' : 's' }}</div>
                    <div v-if="expandedDetail.comments.length">
                      <div class="comment" v-for="c in expandedDetail.comments" :key="c.id">
                        <span class="comment__avatar">{{ initials(c.authorName) }}</span>
                        <div>
                          <span class="comment__name">{{ c.authorName }}</span>
                          <span class="comment__time"> · {{ relativeTime(c.createdAt) }}</span>
                          <p class="comment__body">{{ c.body }}</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="empty" style="padding:16px 0;">Aucun commentaire pour l'instant.</p>
                  </template>

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
        </template>
      </div>
    </section>
  `,
};
