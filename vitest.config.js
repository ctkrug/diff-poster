import { defineConfig } from "vite";

export default defineConfig({
  test: {
    // jsdom, not the vitest default "node" environment, since main.js and
    // future UI code touch the DOM directly (no framework abstracting it).
    environment: "jsdom",
    // e2e/ holds Playwright specs, run separately via `npm run test:e2e` —
    // vitest's default include glob would otherwise try (and fail) to
    // collect them as unit tests.
    exclude: ["**/node_modules/**", "e2e/**"],
    coverage: {
      // Coverage should measure app source, not tooling config files that
      // happen to sit at the repo root (vite/vitest/playwright configs).
      include: ["src/**"],
    },
  },
});
