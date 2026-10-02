import type { ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* =====================================================
   Liste déroulante avec icônes (v3.7) : un <select> natif ne peut pas
   afficher d'image dans ses options. Même usage qu'un <select> contrôlé ;
   clavier, focus et fermeture gérés par Radix.
===================================================== */

export interface IconSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Texte secondaire, à droite (stock, taux…). */
  hint?: ReactNode;
  disabled?: boolean;
}

export function IconSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "— choisir —",
  ariaLabel,
  className,
  size = "md",
  disabled,
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: IconSelectOption<T>[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "group flex min-w-0 items-center gap-2 border border-cyan-glow/20 bg-space-900/80 px-2.5 text-left text-slate-100 outline-none transition-colors",
          "hover:border-cyan-glow/40 focus-visible:border-cyan-glow/60 data-[state=open]:border-cyan-glow/60 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8 text-xs" : "h-10 text-sm",
          className,
        )}
      >
        {current?.icon && <span className="flex shrink-0 items-center [&_img]:h-5 [&_img]:w-5">{current.icon}</span>}
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-slate-500")}>{current?.label ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 max-h-[min(22rem,var(--radix-dropdown-menu-content-available-height))] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto glass-panel p-1 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 [animation-iteration-count:1]"
        >
          <DropdownMenuPrimitive.RadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
            {options.map((o) => (
              <DropdownMenuPrimitive.RadioItem
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm text-slate-200 outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:bg-cyan-glow/10 data-[state=checked]:text-cyan-glow"
              >
                {o.icon && <span className="flex shrink-0 items-center [&_img]:h-6 [&_img]:w-6">{o.icon}</span>}
                <span className="flex-1 whitespace-nowrap">{o.label}</span>
                {o.hint && <span className="whitespace-nowrap pl-3 font-mono text-[11px] text-slate-500">{o.hint}</span>}
                <DropdownMenuPrimitive.ItemIndicator>
                  <Check className="h-3.5 w-3.5" />
                </DropdownMenuPrimitive.ItemIndicator>
              </DropdownMenuPrimitive.RadioItem>
            ))}
          </DropdownMenuPrimitive.RadioGroup>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
