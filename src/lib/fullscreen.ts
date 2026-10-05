/* 5.21.1 : mode plein écran du jeu (API Fullscreen du navigateur). */

export function fullscreenSupported(): boolean {
  return typeof document !== "undefined" && !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;
}

export function isFullscreen(): boolean {
  return typeof document !== "undefined" && !!document.fullscreenElement;
}

/** Bascule le plein écran ; sans effet si le navigateur le refuse (iPhone, iframe). */
export async function toggleFullscreen(): Promise<void> {
  try {
    if (isFullscreen()) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch {
    /* refusé par le navigateur */
  }
}
