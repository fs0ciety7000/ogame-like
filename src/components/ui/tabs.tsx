import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

/** Défile horizontalement quand les onglets dépassent (téléphone). */
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "hud-cut-sm inline-flex max-w-full items-center gap-1 overflow-x-auto border border-cyan-glow/15 bg-space-900/70 p-1 [scrollbar-width:none]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "shrink-0 whitespace-nowrap px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 transition-colors",
        "data-[state=active]:bg-cyan-glow/15 data-[state=active]:text-cyan-glow data-[state=active]:shadow-[inset_0_-2px_0_0_var(--color-cyan-glow)]",
        "hover:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  // 5.15.12 : glissement court à l'ouverture d'un onglet (coupé si « réduire les animations »).
  return <TabsPrimitive.Content className={cn("tab-enter focus:outline-none", className)} {...props} />;
}
