import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { changelogIndex } from "./changelog-index-plugin";
import { pagePreload } from "./page-preload-plugin";

export default defineConfig({
  // 6.14.152 (R4) : `pagePreload` précharge le code de la page ouverte dès index.html.
  plugins: [react(), tailwindcss(), changelogIndex(), pagePreload()],
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
        // 6.3.2 (lot S) : les briques d'interface tierces dans leur propre bloc. Elles changent rarement :
        // un déploiement ne les fait plus retélécharger (avant, elles étaient dans le bloc d'entrée).
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/node_modules/pocketbase/")) return "pocketbase";
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|zustand|framer-motion|scheduler)\//.test(id)) return "vendor";
          if (/\/node_modules\/(@radix-ui|@floating-ui|tailwind-merge|sonner|react-remove-scroll|react-remove-scroll-bar|react-style-singleton|use-callback-ref|use-sidecar|aria-hidden|clsx|class-variance-authority|get-nonce|tslib)\//.test(id)) return "ui";
          return undefined;
        },
      },
    },
  },
});
