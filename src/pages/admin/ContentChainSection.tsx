import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, HudChip, HudSwitch, HudTag } from "@/components/ui/hud";
import { useContentStore } from "@/services/contentService";
import { CHAIN_KIND_ADMIN_TAB, CHAIN_KIND_LABELS, CHAIN_LINK_ADMIN_TAB, CHAIN_LINK_LABELS, chainRowScore, contentChainReport, type ChainKind, type ChainLink, type ChainRow } from "@/game/contentChain";
import { cn } from "@/lib/utils";

/* 6.14.114 (AJ27-4, constat AJ-10) : bilan de la chaîne de contenu (WORKFLOW.md §7, CLAUDE.md règle n° 4) pour tout le
   contenu en vigueur, y compris ajouté ou modifié dans l'admin : pour chaque contenu, les maillons présents et manquants
   (Codex, succès, préréglage, porteurs, Ctrl+K), avec un lien vers l'onglet où le régler. */

const KINDS = Object.keys(CHAIN_KIND_LABELS) as ChainKind[];

const missing = (r: ChainRow) => (Object.entries(r.links) as [ChainLink, boolean | null][]).filter(([, v]) => v === false).map(([l]) => l);

export function ContentChainSection() {
  // Se recalcule quand l'administration change le contenu (abonnement à la version du contenu).
  useContentStore((s) => s.version);
  const [, setParams] = useSearchParams();
  const [kind, setKind] = useState<ChainKind>("unit");
  const [onlyGaps, setOnlyGaps] = useState(true);
  const rows = contentChainReport();
  const gapsOf = (k: ChainKind) => rows.filter((r) => r.kind === k).reduce((a, r) => a + missing(r).length, 0);
  const totalGaps = rows.reduce((a, r) => a + missing(r).length, 0);
  const shown = rows.filter((r) => r.kind === kind && (!onlyGaps || missing(r).length > 0));
  const go = (tab: string) => setParams({ onglet: tab });

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
          <Link2 className="h-4 w-4 text-cyan-glow" /> Chaîne de contenu
        </h3>
        <span className="ml-auto text-[11px] text-slate-500">
          <span className="font-mono tabular-nums">{rows.length}</span> contenus · <span className="font-mono tabular-nums">{totalGaps}</span> maillons manquants
        </span>
      </div>
      <p className="text-xs text-slate-400">Chaque contenu en vigueur (code et admin) avec ses maillons vérifiables : Codex, succès d'entrée, de maîtrise et propre, préréglage d'effet, porteurs, recherche Ctrl+K. Les autres maillons (image, défi, changelog) se cochent dans la fiche du lot.</p>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Type de contenu">
        {KINDS.map((k) => {
          const n = gapsOf(k);
          return (
            <HudChip key={k} asChild size="sm" tone={k === kind ? "accent" : n > 0 ? "ember" : "neutral"}>
              <button type="button" role="tab" aria-selected={k === kind} onClick={() => setKind(k)}>
                {CHAIN_KIND_LABELS[k]} <span className="font-mono tabular-nums">{n}</span>
              </button>
            </HudChip>
          );
        })}
      </div>
      <span className="flex items-center gap-2 text-xs text-slate-300">
        <HudSwitch checked={onlyGaps} onCheckedChange={setOnlyGaps} label="Seulement les contenus incomplets" />
        Seulement les contenus incomplets
      </span>
      {shown.length === 0 ? (
        <EmptyState size="sm" icon={<CheckCircle2 className="h-6 w-6 text-mint-glow" />} title="Chaîne complète">
          Aucun maillon vérifiable ne manque pour ce type de contenu.
        </EmptyState>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {shown.map((r) => {
            const s = chainRowScore(r);
            return (
              <li key={`${r.kind}:${r.id}`} className="flex flex-col gap-1.5 py-2">
                <div className="flex min-w-0 items-baseline gap-2">
                  <button type="button" className="min-w-0 truncate text-left text-sm text-slate-100 hover:text-cyan-glow" onClick={() => go(CHAIN_KIND_ADMIN_TAB[r.kind])}>
                    {r.name}
                  </button>
                  <span className="min-w-0 truncate font-mono text-[11px] text-slate-500">{r.id}</span>
                  <span className={cn("ml-auto shrink-0 font-mono text-[11px] tabular-nums", s.ok === s.expected ? "text-mint-glow" : "text-ember-glow")}>
                    {s.ok}/{s.expected}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Object.entries(r.links) as [ChainLink, boolean | null][])
                    .filter(([, v]) => v !== null)
                    .map(([l, v]) => {
                      const tab = CHAIN_LINK_ADMIN_TAB[l];
                      const label = `${v ? "✓" : "✗"} ${CHAIN_LINK_LABELS[l]}`;
                      return !v && tab ? (
                        <HudChip key={l} asChild size="sm" tone="danger">
                          <button type="button" title="Ouvrir l'onglet où le régler" onClick={() => go(tab)}>
                            {label}
                          </button>
                        </HudChip>
                      ) : (
                        <HudTag key={l} tone={v ? "mint" : "danger"}>
                          {label}
                        </HudTag>
                      );
                    })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
