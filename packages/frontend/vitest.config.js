import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

// The app's own Vite setup, plus a simulated browser (jsdom) for the
// UI tests in src/tests
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/tests/setup.js"],
      // Each test gets a fresh fake backend
      unstubGlobals: true,
      restoreMocks: true
    }
  })
);
