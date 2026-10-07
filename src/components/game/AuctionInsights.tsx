import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, BellPlus, ChevronDown, LineChart, X, TrendingUp } from "lucide-react";
import { HudPanel, PagedList } from "@/components/ui/panel";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AmberIcon } from "@/components/ui/amber";
import { IconSelect } from "@/components/ui/icon-select";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { AUCTION_WATCH_RULES, currencyLabel, describeWatch, lotRarity, priceSummary, type AuctionCurrency, type AuctionHistory, type AuctionKind, type AuctionSale, type AuctionWatch } from "@/game/auctions";
import { MODULE_TEMPLATES } from "@/game/modules";
import { RELICS } from "@/game/relics";
import { unwatchAuctions, useAuctionWatches, watchAuctions } from "@/services/auctionService";
import { cn, formatCompact, timeAgo } from "@/lib/utils";

/* 5.26.2 : cote des lots (historique des ventes conclues, par modèle et
   rareté) et alertes de vente (notification à chaque mise en vente qui
   correspond). */

function SalePrice({ res, value }: { res: AuctionCurrency; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono tabular-nums" title={currencyLabel(res)}>
      {res === "amber" ? <AmberIcon className="h-3.5 w-3.5" /> : <ResourceIcon id={res} className="h-3.5 w-3.5" />}
      {formatCompact(value)}
    </span>
  );
}

/** Cote d'un lot dans la monnaie de la vente : médiane des ventes conclues. */
export function LotQuote({ sales, res }: { sales: AuctionSale[] | undefined; res: AuctionCurrency }) {
  const s = sales ? priceSummary(sales, res) : null;
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 text-slate-500" title={`Ventes conclues : de ${formatCompact(s.min)} à ${formatCompact(s.max)}, dernière à ${formatCompact(s.last)}.`}>
      cote <SalePrice res={res} value={s.median} /> <span className="font-mono tabular-nums">({s.count})</span>
    </span>
  );
}

export function PriceHistoryPanel({ history }: { history: AuctionHistory }) {
  const [kind, setKind] = useState<"all" | AuctionKind>("all");
  const [open, setOpen] = useState<string | null>(null);
  const lots = useMemo(
    () =>
      Object.entries(history.lots)
        .filter(([, l]) => kind === "all" || l.kind === kind)
        .sort(([, a], [, b]) => (b.sales[b.sales.length - 1]?.atMs ?? 0) - (a.sales[a.sales.length - 1]?.atMs ?? 0)),
    [history, kind],
  );
  return (
    <HudPanel
      icon={<LineChart />}
      title="Cote des lots"
      aside={
        <div className="flex gap-1">
          {(
            [
              ["all", "Tout"],
              ["relic", "Reliques"],
              ["module", "Plans"],
            ] as const
          ).map(([k, label]) => (
            <HudChip key={k} size="sm" tone={kind === k ? "accent" : "neutral"} asChild>
              <button type="button" onClick={() => setKind(k)} aria-pressed={kind === k}>
                {label}
              </button>
            </HudChip>
          ))}
        </div>
      }
    >
      {lots.length === 0 ? (
        <EmptyState icon={<TrendingUp />} title="Pas encore de vente conclue" size="sm" className="p-0">
          Chaque vente conclue s'ajoute ici : prix médian, dernier prix et fourchette, par modèle et par rareté.
        </EmptyState>
      ) : (
        <PagedList
          items={lots}
          as="ul"
          className="flex flex-col divide-y divide-white/5"
          render={([key, l]) => {
            const last = l.sales[l.sales.length - 1];
            const sum = priceSummary(l.sales, last.res);
            const rarity = lotRarity(l.kind, l.rarity);
            const expanded = open === key;
            return (
              <li key={key} className="py-1.5">
                <button type="button" className="flex w-full flex-wrap items-center gap-2 text-left text-sm" onClick={() => setOpen(expanded ? null : key)} aria-expanded={expanded}>
                  <span className="min-w-0 flex-1 truncate text-slate-200">
                    {l.kind === "module" ? "Plan : " : ""}
                    {l.label}
                  </span>
                  <HudChip size="sm" tone={rarity.tone}>
                    {rarity.label}
                  </HudChip>
                  <span className="text-xs text-slate-400">
                    médiane {sum ? <SalePrice res={last.res} value={sum.median} /> : "—"}
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", expanded && "rotate-180")} aria-hidden />
                </button>
                {expanded && (
                  <ul className="mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3 text-xs text-slate-400">
                    {[...l.sales].reverse().map((s, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <SalePrice res={s.res} value={s.price} />
                        <span className="font-mono text-[11px] text-slate-500">{timeAgo(s.atMs)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }}
        />
      )}
    </HudPanel>
  );
}

const RARITY_CHOICES = [
  { id: "common", label: "Commun" },
  { id: "rare", label: "Rare" },
  { id: "epic", label: "Épique" },
  { id: "legendary", label: "Légendaire" },
] as const;

export function WatchPanel({ uid }: { uid: string }) {
  const { watches, reload } = useAuctionWatches(uid);
  const [kind, setKind] = useState<AuctionWatch["kind"]>("module");
  const [minRarity, setMinRarity] = useState("legendary");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const templates = kind === "module" ? MODULE_TEMPLATES.map((t) => ({ value: t.id, label: t.name })) : kind === "relic" ? RELICS.map((t) => ({ value: t.id, label: t.name })) : [];
  const full = watches.length >= AUCTION_WATCH_RULES.maxPerPlayer;

  const add = async () => {
    setBusy(true);
    try {
      await watchAuctions({ kind, minRarity, template });
      toast.success(`Alerte ajoutée : ${describeWatch({ kind, minRarity, template })}.`);
      setTemplate("");
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  };
  const remove = async (w: AuctionWatch) => {
    if (!(await askConfirm({ title: "Supprimer cette alerte ?", message: describeWatch(w), confirmLabel: "Supprimer", tone: "danger" }))) return;
    try {
      await unwatchAuctions(String(w.id));
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <HudPanel icon={<Bell />} title="Alertes de vente" tone="violet" aside={<span className="font-mono text-xs tabular-nums text-slate-500">{watches.length} / {AUCTION_WATCH_RULES.maxPerPlayer}</span>}>
      <p className="text-xs text-slate-400">Une notification dès qu'un lot qui correspond est mis en vente.</p>
      {watches.length > 0 && (
        <ul className="flex flex-col gap-1">
          {watches.map((w) => (
            <li key={w.id} className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-2 py-1.5 text-sm text-slate-200">
              <Bell className="h-3.5 w-3.5 shrink-0 text-violet-glow" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{describeWatch(w)}</span>
              <button type="button" className="text-slate-500 hover:text-danger-glow" aria-label="Supprimer l'alerte" title="Supprimer l'alerte" onClick={() => void remove(w)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-slate-500">Lots</span>
          {(
            [
              ["module", "Plans"],
              ["relic", "Reliques"],
              ["any", "Les deux"],
            ] as const
          ).map(([k, label]) => (
            <HudChip key={k} size="sm" tone={kind === k ? "violet" : "neutral"} asChild>
              <button
                type="button"
                onClick={() => {
                  setKind(k);
                  setTemplate("");
                }}
                aria-pressed={kind === k}
              >
                {label}
              </button>
            </HudChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-slate-500">Dès</span>
          {RARITY_CHOICES.map((r) => (
            <HudChip key={r.id} size="sm" tone={minRarity === r.id ? lotRarity("module", r.id).tone : "neutral"} asChild>
              <button type="button" onClick={() => setMinRarity(r.id)} aria-pressed={minRarity === r.id}>
                {r.label}
              </button>
            </HudChip>
          ))}
        </div>
        {templates.length > 0 && (
          <IconSelect<string> size="sm" value={template} onChange={setTemplate} options={[{ value: "", label: "Tous les modèles" }, ...templates]} placeholder="Tous les modèles" ariaLabel="Modèle" />
        )}
        <Button size="sm" variant="secondary" className="self-start" disabled={busy || full} title={full ? `${AUCTION_WATCH_RULES.maxPerPlayer} alertes au plus.` : undefined} onClick={() => void add()}>
          <BellPlus className="h-3.5 w-3.5" /> Ajouter l'alerte
        </Button>
      </div>
    </HudPanel>
  );
}
