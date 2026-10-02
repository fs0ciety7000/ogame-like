import { useAllianceTag } from "@/store/directoryStore";
import { cn } from "@/lib/utils";

/** « [TAG] Pseudo » : le tag d'alliance précède le pseudo (v3.5.1). */
export function PlayerName({ uid, pseudo, allianceId, className, tagClassName }: { uid?: string | null; pseudo: string; allianceId?: string | null; className?: string; tagClassName?: string }) {
  const tag = useAllianceTag(uid, allianceId);
  return (
    <span className={className}>
      {tag && <span className={cn("mr-1 font-mono text-[0.85em] text-gold-glow/80", tagClassName)}>[{tag}]</span>}
      {pseudo}
    </span>
  );
}
