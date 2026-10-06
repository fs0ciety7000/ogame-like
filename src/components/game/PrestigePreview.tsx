import { HomePlanet } from "@/components/game/HomePlanet";
import { RoomIcon } from "@/components/game/roomIcons";
import { TitleBadge } from "@/components/game/TitleBadge";
import { HUD_TONE, type HudTone } from "@/components/ui/hud";
import { BOUNTY_SHOP_RULES, KESH, KESH_EMOJIS, NAME_TONES, type ShopItemId } from "@/game/bounties";
import { ROOM_ICONS } from "@/game/globalChat";
import { DEFAULT_PLANET_LOOK, type PlanetLook } from "@/game/planetLook";
import { assetUrl } from "@/lib/assets";

/* 5.27 : aperçu d'un objet de prestige du Comptoir, avant l'achat (carte)
   et à la révélation qui suit l'achat. Couleurs : jetons du thème. */

export const PREVIEWABLE: ShopItemId[] = ["nameColor", "keshReaction", "roomBanner", "planetFx", "title", "emblem", "emojis", "frame"];

export function PrestigePreview({ item, pseudo, look }: { item: ShopItemId; pseudo: string; look?: PlanetLook }) {
  switch (item) {
    case "nameColor":
      return (
        <ul className="flex flex-col gap-1 text-sm" aria-label="Couleurs disponibles">
          {NAME_TONES.map((t) => (
            <li key={t.id} className="flex items-baseline gap-2">
              <span className="w-14 font-mono text-[10px] uppercase tracking-wider text-slate-500">{t.label}</span>
              <span className="font-semibold" style={{ color: HUD_TONE[t.id as HudTone] }}>
                {pseudo}
              </span>
              <span className="truncate text-slate-400">salut le canal !</span>
            </li>
          ))}
        </ul>
      );
    case "keshReaction":
      return (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="truncate">Bien joué pour le boss !</span>
          <span className="inline-flex items-center gap-1 border border-cyan-glow/50 bg-cyan-glow/10 px-1.5 text-xs">
            <img src={assetUrl(KESH.emblem)} alt="" className="h-4 w-4 object-contain" />
            <span className="font-mono text-[10px] tabular-nums text-slate-300">3</span>
          </span>
        </div>
      );
    case "roomBanner":
      return (
        <div className="flex flex-wrap gap-1.5" aria-label="Icônes de salon">
          {ROOM_ICONS.map((i) => (
            <span key={i.id} className="inline-flex items-center gap-1 border border-violet-glow/30 bg-violet-glow/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-glow">
              <RoomIcon icon={i.id} className="h-3 w-3" /> {i.label}
            </span>
          ))}
        </div>
      );
    case "planetFx":
      return (
        <div className="flex items-center justify-center gap-6">
          {[
            { label: "Anneau d'ambre", look: { ...(look ?? DEFAULT_PLANET_LOOK), ring: "ambre" } },
            { label: "Aurore", look: { ...(look ?? DEFAULT_PLANET_LOOK), atmosphere: "aurore" } },
          ].map((v) => (
            <figure key={v.label} className="flex flex-col items-center gap-1">
              <HomePlanet buildings={{}} size={72} look={v.look} />
              <figcaption className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{v.label}</figcaption>
            </figure>
          ))}
        </div>
      );
    case "title":
      return (
        <p className="flex items-center gap-2 text-sm text-slate-200">
          {pseudo} <TitleBadge label={BOUNTY_SHOP_RULES.title} size="xs" />
        </p>
      );
    case "emblem":
      return <img src={assetUrl(KESH.emblem)} alt="Emblème de l'Essaim" className="mx-auto h-16 w-16 object-contain" />;
    case "emojis":
      return (
        <div className="flex justify-center gap-2">
          {KESH_EMOJIS.map((e) => (
            <img key={e.code} src={assetUrl(e.url)} alt={e.code} className="h-10 w-10" />
          ))}
        </div>
      );
    case "frame":
      return (
        <div className="kesh-frame mx-auto max-w-xs border border-gold-glow/30 p-3 text-center text-sm text-slate-200">
          Fiche publique de <strong>{pseudo}</strong>
        </div>
      );
    default:
      return null;
  }
}
