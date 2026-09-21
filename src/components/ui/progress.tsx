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
        "relative h-2 w-full overflow-hidden rounded-full bg-space-600/80 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(10%-1px),rgba(255,255,255,0.08)_10%)]",
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-cyan-glow to-mint-glow transition-transform duration-500 ease-out shadow-[0_0_10px_-1px_var(--color-cyan-glow)]",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
