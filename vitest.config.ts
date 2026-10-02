import { defineConfig } from "vitest/config";
import path from "node:path";
import { changelogIndex } from "./changelog-index-plugin";

export default defineConfig({
  plugins: [changelogIndex()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
