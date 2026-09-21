import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  online: { dot: "bg-mint-glow shadow-[0_0_8px_1px_var(--color-mint-glow)]", text: "text-mint-glow" },
  warning: { dot: "bg-gold-glow shadow-[0_0_8px_1px_var(--color-gold-glow)]", text: "text-gold-glow" },
  alert: { dot: "bg-ember-glow shadow-[0_0_8px_1px_var(--color-ember-glow)]", text: "text-ember-glow" },
  danger: { dot: "bg-danger-glow shadow-[0_0_8px_1px_var(--color-danger-glow)]", text: "text-danger-glow" },
  neutral: { dot: "bg-slate-500", text: "text-slate-400" },
} as const;

export type StatusDotStatus = keyof typeof STATUS_STYLES;

/** Puce de statut façon HUD (point coloré + libellé mono uppercase), ex:
 *  "● SYSTÈME OPTIMAL". Le point pulse doucement pour signaler un flux vivant. */
export function StatusDot({
  status = "online",
  label,
  className,
}: {
  status?: StatusDotStatus;
  label: string;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full animate-pulse-slow", style.dot)} />
      <span className={cn("hud-eyebrow", style.text)}>{label}</span>
    </span>
  );
}
