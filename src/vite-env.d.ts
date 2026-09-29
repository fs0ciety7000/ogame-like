/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du serveur PocketBase, ex. https://pocketbase.mondomaine.fr */
  readonly VITE_POCKETBASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
