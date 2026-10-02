import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { changelogIndex } from "./changelog-index-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), changelogIndex()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pocketbase: ["pocketbase"],
          vendor: ["react", "react-dom", "react-router-dom", "zustand", "framer-motion"],
        },
      },
    },
  },
});
