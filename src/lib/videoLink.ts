/* 5.24 : liens de vidéo lisibles dans les messages et le chat. */

const VIDEO_RE = /^(?:https:\/\/[^\s?#]+|\/assets\/[\w./-]+)\.(?:mp4|webm)(?:[?#][^\s]*)?$/i;

/** Vidéo du jeu (/assets/…) ou lien https se terminant par .mp4 / .webm. */
export function isVideoLink(url: string): boolean {
  return VIDEO_RE.test(url) && !url.includes("..");
}
