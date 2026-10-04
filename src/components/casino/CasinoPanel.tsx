import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* 5.15.8 : une seule forme de carte pour le casino (en-tête mono, icône, info à droite). */

export function CasinoPanel({ icon, title, tone = "muted", aside, accent, className, children }: { icon?: ReactNode; title: string; tone?: "muted" | "gold"; aside?: ReactNode; accent?: boolean; className?: string; children: ReactNode }) {
  return (
    <Card className={cn("flex flex-col gap-3 p-4", accent && "border-t-2 border-t-gold-glow", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("hud-eyebrow flex items-center gap-2 text-[10px] [&_svg]:h-3.5 [&_svg]:w-3.5", tone === "gold" ? "text-gold-glow" : "text-slate-500")}>
          {icon}
          {title}
        </p>
        {aside && <span className="ml-auto">{aside}</span>}
      </div>
      {children}
    </Card>
  );
}
