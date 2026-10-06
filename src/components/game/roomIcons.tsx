import { Coins, Crown, Flame, Hash, Rocket, Shield, Skull, Sparkles, Swords, type LucideIcon } from "lucide-react";

/* 5.26.3 : icônes de salon (Bannière de salon), partagées par le canal et l'aperçu du Comptoir. */
export const ROOM_ICON: Record<string, LucideIcon> = { swords: Swords, coins: Coins, skull: Skull, rocket: Rocket, shield: Shield, crown: Crown, flame: Flame, sparkles: Sparkles };

export function RoomIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = (icon && ROOM_ICON[icon]) || Hash;
  return <Icon className={className} aria-hidden />;
}
