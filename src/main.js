import { createApp } from "vue";
import App from "./App.js";
import { router } from "./router/index.js";

const clickOutside = {
  mounted(el, binding) {
    el.__clickOutsideHandler__ = (e) => {
      if (!(el === e.target || el.contains(e.target))) {
        binding.value(e);
      }
    };
    document.addEventListener("click", el.__clickOutsideHandler__, true);
  },
  unmounted(el) {
    document.removeEventListener("click", el.__clickOutsideHandler__, true);
  },
};

const app = createApp(App);
app.directive("click-outside", clickOutside);
app.use(router);
app.mount("#app");
