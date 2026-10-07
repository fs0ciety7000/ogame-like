/// <reference types="vite/client" />

declare module "virtual:changelog-index" {
  /** Métadonnées du journal, plus récente d'abord (voir changelog-index-plugin.ts). */
  export const CHANGELOG_INDEX: { id: string; version: string | null; iteration: number | null }[];
}

interface ImportMetaEnv {
  /** URL du serveur PocketBase, ex. https://pocketbase.mondomaine.fr */
  readonly VITE_POCKETBASE_URL: string;
  /** v5.8 : adresse du devblog (https://devblog.fs0ciety.org par défaut). */
  readonly VITE_BLOG_URL?: string;
  /** 6.14.8 : libellé du serveur de test (pré-prod) ; vide en production. */
  readonly VITE_SERVER_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
