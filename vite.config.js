import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the built site works when served from any
  // subpath (e.g. apps.charliekrug.com/diff-poster), not just the domain root.
  base: "./",
  // Emit the static build to site/ — the directory the factory publishes as
  // the live app; the app is its own landing page (wordmark, GitHub link,
  // and the below-fold explainer/FAQ all ship in index.html).
  build: {
    outDir: "site",
    emptyOutDir: true,
  },
});
