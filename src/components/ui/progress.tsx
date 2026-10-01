import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-1.5 w-full overflow-hidden bg-white/[0.06]",
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "hud-sheen h-full bg-gradient-to-r from-cyan-glow to-mint-glow shadow-[0_0_10px_-1px_var(--color-cyan-glow)] transition-transform duration-500 ease-out",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
