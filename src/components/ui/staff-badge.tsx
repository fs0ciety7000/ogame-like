import { Code2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAFF_LABELS } from "@/game/staff";
import { useStaffRole } from "@/services/staffService";

const STYLE = {
  developer: { icon: Code2, short: "Dev", className: "border-violet-glow/60 bg-violet-glow/15 text-violet-glow shadow-[0_0_10px_-3px_var(--color-violet-glow)]" },
  admin: { icon: ShieldCheck, short: "Admin", className: "border-ember-glow/60 bg-ember-glow/15 text-ember-glow shadow-[0_0_10px_-3px_var(--color-ember-glow)]" },
} as const;

/** Badge d'équipe (Développeur / Administrateur) à côté d'un pseudo. */
export function StaffBadge({ uid, compact, className }: { uid: string | null | undefined; compact?: boolean; className?: string }) {
  const role = useStaffRole(uid);
  if (!role) return null;
  const s = STYLE[role];
  const Icon = s.icon;
  return (
    <span
      title={`${STAFF_LABELS[role]} de Cosmic Empires`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 border px-1.5 py-px font-mono text-[11px] font-bold uppercase not-italic leading-[1.5] tracking-[0.14em] [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]",
        s.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {compact ? s.short : STAFF_LABELS[role]}
    </span>
  );
}
