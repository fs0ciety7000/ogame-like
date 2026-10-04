import { Gem } from "lucide-react";
import { describeRelic, mythicFor } from "@/game/relics";
import { currentSeasonId } from "@/game/seasons";

/** v5.1 : la relique mythique du mois, remise au n°1 du boss qui la porte. */
export function MythicRelicNotice({ source }: { source: "leviathan" | "seasonboss" }) {
  const def = mythicFor(currentSeasonId(Date.now()));
  const here = def.source === source;
  return (
    <div
      className="hud-cut-sm flex items-start gap-3 border px-4 py-3 text-sm"
      style={{ borderColor: here ? "#ff5df088" : "rgba(148,163,184,0.2)", background: here ? "radial-gradient(circle at left, #ff5df022, transparent 70%)" : undefined }}
    >
      <Gem className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#ff5df0" }} />
      <div>
        <p className="font-semibold text-white">
          Relique mythique du mois : <span style={{ color: "#ff5df0" }}>{def.template.name}</span>{" "}
          <span className="text-xs text-slate-400">({describeRelic({ template: def.template.id, rarity: "mythic" })})</span>
        </p>
        <p className="text-xs text-slate-400">
          {here
            ? "Remise au n°1 du classement si ce boss tombe. Une seule par saison : elle ne se fusionne ni ne se recycle."
            : `Ce mois-ci, elle est portée par ${def.source === "leviathan" ? "le Léviathan" : "le boss de saison"}.`}
        </p>
      </div>
    </div>
  );
}
