import { defineConfig } from "vite";

export default defineConfig({
  test: {
    // jsdom, not the vitest default "node" environment, since main.js and
    // future UI code touch the DOM directly (no framework abstracting it).
    environment: "jsdom",
  },
});
