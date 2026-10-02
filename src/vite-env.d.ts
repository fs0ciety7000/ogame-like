/// <reference types="vite/client" />

declare module "virtual:changelog-index" {
  /** Métadonnées du journal, plus récente d'abord (voir changelog-index-plugin.ts). */
  export const CHANGELOG_INDEX: { id: string; version: string | null; iteration: number | null }[];
}

interface ImportMetaEnv {
  /** URL du serveur PocketBase, ex. https://pocketbase.mondomaine.fr */
  readonly VITE_POCKETBASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
