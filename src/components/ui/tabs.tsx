import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("hud-cut-sm inline-flex items-center gap-1 border border-cyan-glow/15 bg-space-900/70 p-1", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 transition-colors",
        "data-[state=active]:bg-cyan-glow/15 data-[state=active]:text-cyan-glow data-[state=active]:shadow-[inset_0_-2px_0_0_var(--color-cyan-glow)]",
        "hover:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("focus:outline-none", className)} {...props} />;
}
