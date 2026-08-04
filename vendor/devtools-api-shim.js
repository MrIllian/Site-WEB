// Minimal no-op shim for '@vue/devtools-api', used only so vue-router's
// browser ESM build (which imports it unconditionally) resolves without
// pulling in Vue Devtools. Safe to delete once bundling with a real build
// tool (Vite/webpack), which tree-shakes this import in production.
export function setupDevtoolsPlugin() {}
