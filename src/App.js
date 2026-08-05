import AppHeader from "./components/layout/AppHeader.js";
import AppFooter from "./components/layout/AppFooter.js";
import { auth } from "./store/auth.js";

export default {
  name: "App",
  components: { AppHeader, AppFooter },
  setup() {
    return { auth };
  },
  template: /* html */ `
    <AppHeader />
    <main>
      <router-view v-if="auth.isReady" v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </router-view>
    </main>
    <AppFooter />
  `,
};
