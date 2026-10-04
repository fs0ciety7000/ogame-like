import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* Jeton du Casino orbital : vue de face (icône, petites tailles) ou de trois-quarts (illustration). */
export function TokenIcon({ size = 16, variant = "icon", className }: { size?: number; variant?: "icon" | "art"; className?: string }) {
  return (
    <img
      src={assetUrl(variant === "art" ? "/assets/casino/jeton.webp" : "/assets/casino/jeton-icone.webp")}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      className={cn("inline-block shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
