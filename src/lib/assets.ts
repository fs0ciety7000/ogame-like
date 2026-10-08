/** Version des images du jeu : à augmenter quand une image est remplacée
 *  sous le même nom, pour que les navigateurs (et le cache de Cloudflare)
 *  la rechargent au lieu de garder l'ancienne pendant des heures. */
export const ASSET_VERSION = "3.1";

/** Ajoute la version aux images locales (/assets/…). Les fichiers envoyés
 *  depuis l'administration ont déjà une adresse unique. */
export function assetUrl(path: string): string {
  if (!path || !path.startsWith("/assets/") || path.includes("?")) return path;
  return `${path}?v=${ASSET_VERSION}`;
}
