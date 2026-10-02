import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme";
import { useSfxStore } from "@/store/sfxStore";
import { ambienceRunning, updateAmbience } from "@/lib/sfx";

/** v4.4 : ambiance sonore du thème, démarrée au premier clic (exigence des
 *  navigateurs) et ajustée quand le thème ou le volume changent. */
export function useAmbience() {
  const theme = useThemeStore((s) => s.theme);
  const enabled = useSfxStore((s) => s.enabled);
  const volume = useSfxStore((s) => s.volumes.ambience);

  useEffect(() => {
    updateAmbience(theme);
  }, [theme, enabled, volume]);

  useEffect(() => {
    if (!enabled || volume <= 0) return;
    const onDown = () => {
      if (!ambienceRunning()) updateAmbience(useThemeStore.getState().theme);
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, [enabled, volume]);
}
