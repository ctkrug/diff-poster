import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the built site works when served from any
  // subpath (e.g. apps.charliekrug.com/diff-poster), not just the domain root.
  base: "./",
});
