import { Link } from "react-router-dom";
import { CornerDownRight, LockOpen } from "lucide-react";
import { HudChip } from "@/components/ui/hud";
import { ALL_NAV_ITEMS, useNavUnlock } from "@/components/layout/NavBar";
import { OBJECTIVE_PAGES } from "@/game/navUnlock";
import type { ChronicleObjective } from "@/game/chronicles";

/** 6.14.76 (DP-L3, proposals/deblocage-progressif.md §5.8) : lien d'un défi du passe ou des Chroniques vers la page où l'on agit.
 *  Une page pas encore au menu est annoncée « Ouvre : … » ; la visiter l'ouvre (ouverture par l'intention, marque `nav:<page>`). */
export function ObjectiveGoLink({ objective, className }: { objective: ChronicleObjective; className?: string }) {
  const closed = useNavUnlock().closed;
  const page = OBJECTIVE_PAGES[objective];
  if (!page) return null;
  const label = ALL_NAV_ITEMS.find((i) => i.to === page)?.label ?? page;
  const opens = closed.has(page);
  return (
    <HudChip asChild size="sm" tone="accent" className={className}>
      <Link to={page} aria-label={opens ? `Ouvre la page ${label}` : `Aller à la page ${label}`}>
        {opens ? <LockOpen aria-hidden /> : <CornerDownRight aria-hidden />}
        {opens ? `Ouvre : ${label}` : label}
      </Link>
    </HudChip>
  );
}
