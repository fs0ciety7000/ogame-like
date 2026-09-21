import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border border-cyan-glow/30 bg-space-800/90 px-2.5 py-1.5 text-xs text-slate-200 shadow-[0_0_16px_-4px_var(--color-cyan-glow)] backdrop-blur-sm",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95",
          "data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-1",
          "data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-1",
          "data-[state=delayed-open]:data-[side=left]:slide-in-from-right-1",
          "data-[state=delayed-open]:data-[side=right]:slide-in-from-left-1",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
