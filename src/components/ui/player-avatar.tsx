import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import { avatarUrl } from "@/services/avatarService";
import { cn } from "@/lib/utils";

/** Avatar par défaut (illustration commune) puis, à défaut, initiales colorées. */
export const DEFAULT_AVATAR = "/assets/avatars/default.webp";

function hue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function PlayerAvatar({ uid, pseudo, file, className }: { uid: string; pseudo: string; file?: string | null; className?: string }) {
  const custom = avatarUrl(uid, file);
  const [stage, setStage] = useState<"custom" | "default" | "initials">(custom ? "custom" : "default");
  const [lastCustom, setLastCustom] = useState(custom);
  if (custom !== lastCustom) {
    setLastCustom(custom);
    setStage(custom ? "custom" : "default");
  }
  const base = cn("hud-cut-sm shrink-0 overflow-hidden border border-white/10 bg-space-950", className ?? "h-12 w-12");
  if (stage === "initials") {
    const h = hue(uid || pseudo);
    return (
      <div className={cn(base, "flex items-center justify-center font-display font-bold text-slate-100")} style={{ background: `linear-gradient(135deg, hsl(${h} 70% 35%), hsl(${(h + 60) % 360} 70% 18%))` }} aria-label={pseudo}>
        {pseudo.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "?"}
      </div>
    );
  }
  return (
    <img
      src={stage === "custom" ? custom : assetUrl(DEFAULT_AVATAR)}
      alt={pseudo}
      loading="lazy"
      className={cn(base, "object-cover")}
      onError={() => setStage(stage === "custom" ? "default" : "initials")}
    />
  );
}
