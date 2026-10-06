import { HudChip } from "@/components/ui/hud";
import { findEmpireClass } from "@/game/empireClass";

/** 6.0 : classe d'empire d'un joueur (classement, fiche publique). Rien sans classe. */
export function EmpireClassChip({ classId, className }: { classId?: string | null; className?: string }) {
  const def = findEmpireClass(classId);
  if (!def) return null;
  return (
    <HudChip size="sm" tone="gold" className={className} title={`Classe d'empire : ${def.name}`}>
      {def.emoji} {def.name}
    </HudChip>
  );
}
