import { useAllianceTag } from "@/store/directoryStore";
import { cn } from "@/lib/utils";
import { OnlineDot } from "@/components/ui/online-dot";

/** « [TAG] Pseudo » : le tag d'alliance précède le pseudo (v3.5.1).
 *  5.16 : pastille verte pulsée si le joueur est en ligne (`presence={false}` pour la masquer). */
export function PlayerName({
  uid,
  pseudo,
  allianceId,
  className,
  tagClassName,
  presence = true,
}: {
  uid?: string | null;
  pseudo: string;
  allianceId?: string | null;
  className?: string;
  tagClassName?: string;
  presence?: boolean;
}) {
  const tag = useAllianceTag(uid, allianceId);
  return (
    <span className={className}>
      {presence && <OnlineDot uid={uid} className="mr-1.5" />}
      {tag && <span className={cn("mr-1 font-mono text-[0.85em] text-gold-glow/80", tagClassName)}>[{tag}]</span>}
      {pseudo}
    </span>
  );
}
