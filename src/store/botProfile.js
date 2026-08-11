import { reactive } from "vue";
import { fetchBotProfile } from "../actions/bot.js";

/*
 * Profil Discord réel de Beep (avatar, bannière, description, version…),
 * partagé par toute l'app (page d'accueil, header, footer) pour ne pas
 * afficher un numéro de version différent selon la page. Un seul fetch
 * au chargement — voir src/actions/bot.js pour la requête elle-même.
 */
const state = reactive({
  profile: null,
  isReady: false,
});

async function refresh() {
  const result = await fetchBotProfile();
  if (result.success) state.profile = result.profile;
  state.isReady = true;
}

refresh();

export const botProfile = state;
