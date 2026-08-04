import AppHeader from "./components/layout/AppHeader.js";
import AppFooter from "./components/layout/AppFooter.js";

export default {
  name: "App",
  components: { AppHeader, AppFooter },
  template: /* html */ `
    <AppHeader />
    <main>
      <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </router-view>
    </main>
    <AppFooter />
  `,
};
