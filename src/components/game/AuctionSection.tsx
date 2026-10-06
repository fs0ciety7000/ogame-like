import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Gavel, Gem, History, Puzzle, Tag, Timer, Trophy, X } from "lucide-react";
import { EmptyAction, HudPanel } from "@/components/ui/panel";
import { EmptyState, HudCallout, HudChip, StatTile } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { NumberInput, resourceStep } from "@/components/ui/number-input";
import { ResourceIcon } from "@/components/ui/game-icon";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { AmberIcon } from "@/components/ui/amber";
import { IconSelect, type IconSelectOption } from "@/components/ui/icon-select";
import { AUCTION_CURRENCIES, AUCTION_RULES, canCancel, currencyBalance, currencyKind, currencyLabel, lotRarity, minNextBid, minStartFor, type Auction, type AuctionCurrency, type AuctionKind } from "@/game/auctions";
import { relicLabel, relicsState, describeRelic } from "@/game/relics";
import { describeModule, moduleLabel, modulesState } from "@/game/modules";
import { bidAuction, cancelAuction, listAuction, useAuctions } from "@/services/auctionService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatCompact, formatDuration, formatNumber, timeAgo } from "@/lib/utils";

/* 5.26 : Hôtel des enchères (onglet de la page Commerce). Reliques (ni
   mythiques, ni équipées) et plans de modules, contre une ressource commune,
   une ressource rare ou de l'Ambre ; taxe de 5 % au pot commun. */

function CurrencyIcon({ res, className }: { res: AuctionCurrency; className?: string }) {
  return res === "amber" ? <AmberIcon className={cn("h-3.5 w-3.5", className)} /> : <ResourceIcon id={res} className={cn("h-3.5 w-3.5", className)} />;
}

function Price({ res, value, className }: { res: AuctionCurrency; value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", className)}>
      <CurrencyIcon res={res} />
      {formatCompact(value)}
    </span>
  );
}

const CURRENCY_GROUPS: Record<ReturnType<typeof currencyKind>, string> = { common: "commune", rare: "rare", amber: "Ruche" };

/** Monnaie de la vente : ressources communes, rares, ou Ambre. */
function CurrencySelect({ value, onChange }: { value: AuctionCurrency; onChange: (v: AuctionCurrency) => void }) {
  const options: IconSelectOption<AuctionCurrency>[] = AUCTION_CURRENCIES.map((c) => ({
    value: c,
    label: currencyLabel(c),
    icon: <CurrencyIcon res={c} />,
    hint: <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{CURRENCY_GROUPS[currencyKind(c)]}</span>,
  }));
  return <IconSelect value={value} onChange={onChange} options={options} size="sm" ariaLabel="Monnaie de la vente" />;
}

function LotIcon({ kind }: { kind: AuctionKind }) {
  const Icon = kind === "relic" ? Gem : Puzzle;
  return (
    <span className="hud-cut-sm grid h-10 w-10 shrink-0 place-items-center border border-white/10 bg-white/[0.03]">
      <Icon className="h-5 w-5 text-slate-300" aria-hidden />
    </span>
  );
}

function SellPanel() {
  const player = usePlayerStore((s) => s.player);
  const [pick, setPick] = useState("");
  const [res, setRes] = useState<AuctionCurrency>("scrap");
  const [price, setPrice] = useState(10_000);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);

  const lots = useMemo(() => {
    if (!player) return [];
    const relics = relicsState(player);
    const out: { key: string; kind: AuctionKind; id: string; label: string; detail: string }[] = [];
    for (const r of relics.items) {
      if (r.rarity === "mythic" || relics.slots.includes(r.id)) continue;
      out.push({ key: `relic:${r.id}`, kind: "relic", id: r.id, label: relicLabel(r), detail: describeRelic(r) });
    }
    for (const m of modulesState(player).items) {
      if (m.built) continue;
      out.push({ key: `module:${m.id}`, kind: "module", id: m.id, label: `Plan : ${moduleLabel(m)}`, detail: describeModule(m) });
    }
    return out;
  }, [player]);

  const lot = lots.find((l) => l.key === pick) ?? null;

  const submit = async () => {
    if (!lot) return;
    const ok = await askConfirm({
      title: `Mettre en vente ${lot.label} ?`,
      message: `Mise à prix ${formatNumber(price)} ${currencyLabel(res).toLowerCase()}, ${hours} h. L'objet quitte ton inventaire ; tu ne pourras annuler que tant que personne n'a enchéri.`,
      confirmLabel: "Mettre en vente",
      tone: "gold",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await listAuction({ kind: lot.kind, itemId: lot.id, res, startPrice: price, durationH: hours });
      toast.success("Vente ouverte à l'Hôtel des enchères.");
      setPick("");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <HudPanel icon={<Tag />} title="Mettre en vente" tone="gold">
      {lots.length === 0 ? (
        <EmptyState icon="🏺" title="Rien à vendre" action={<EmptyAction to="/game/etat-major?onglet=modules">Voir mes modules</EmptyAction>} className="p-0">
          Les reliques non équipées (sauf mythiques) et les plans de modules pas encore fabriqués se vendent ici.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {lots.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setPick(l.key)}
                aria-pressed={pick === l.key}
                className={cn("flex items-center gap-2 border p-2 text-left transition-colors", pick === l.key ? "border-gold-glow/60 bg-gold-glow/10" : "border-white/5 bg-white/[0.02] hover:border-gold-glow/30")}
              >
                {l.kind === "relic" ? <Gem className="h-4 w-4 shrink-0 text-violet-glow" aria-hidden /> : <Puzzle className="h-4 w-4 shrink-0 text-mint-glow" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-100">{l.label}</span>
                  <span className="block truncate text-[11px] text-slate-500">{l.detail}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Monnaie</span>
              <CurrencySelect value={res} onChange={(v) => {
                  setRes(v);
                  setPrice((p) => Math.max(p, minStartFor(v)));
                }} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Mise à prix</span>
              <NumberInput size="sm" quick={false} min={minStartFor(res)} step={currencyKind(res) === "common" ? resourceStep(Math.max(1000, price * 10)) : 1} value={price} onChange={setPrice} aria-label="Mise à prix" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Durée</span>
            {AUCTION_RULES.durationsH.map((h) => (
              <HudChip key={h} size="sm" tone={hours === h ? "gold" : "neutral"} onClick={() => setHours(h)} aria-pressed={hours === h}>
                {h} h
              </HudChip>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Mise à prix minimale : <span className="font-mono tabular-nums">{formatNumber(minStartFor(res))}</span> {currencyLabel(res).toLowerCase()}. Taxe de{" "}
            <span className="font-mono tabular-nums">{Math.round(AUCTION_RULES.taxRate * 100)} %</span> sur le prix final, versée au pot
            commun (Ambre comprise). {AUCTION_RULES.maxOpenPerSeller} ventes ouvertes au plus.
          </p>
          <Button variant="warn" disabled={!lot || busy || !(price >= minStartFor(res))} onClick={() => void submit()}>
            <Gavel className="h-4 w-4" /> Mettre en vente
          </Button>
        </div>
      )}
    </HudPanel>
  );
}

function AuctionRow({ a, uid, now }: { a: Auction; uid: string; now: number }) {
  const player = usePlayerStore((s) => s.player);
  const min = minNextBid(a);
  const [amount, setAmount] = useState(min);
  const [busy, setBusy] = useState(false);
  const mineSale = a.sellerId === uid;
  const leading = a.bidderId === uid;
  const left = Math.max(0, a.endsAtMs - now);
  const rarity = lotRarity(a.kind, a.rarity);
  const stock = player ? currencyBalance(player, a.res) : 0;
  const need = leading ? amount - a.bid : amount;
  const value = Math.max(amount, min);

  const bid = async () => {
    setBusy(true);
    try {
      await bidAuction(a.id, value);
      toast.success(`Enchère placée : ${formatNumber(value)} ${currencyLabel(a.res).toLowerCase()}.`);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  };

  const cancel = async () => {
    if (!(await askConfirm({ title: "Annuler cette vente ?", message: "L'objet revient dans ton inventaire.", confirmLabel: "Annuler la vente", tone: "danger" }))) return;
    setBusy(true);
    try {
      await cancelAuction(a.id);
      toast.success("Vente annulée.");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3 border p-3", leading ? "border-mint-glow/40 bg-mint-glow/5" : "border-white/5 bg-white/[0.02]")}>
      <LotIcon kind={a.kind} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-100">
          {a.label}
          <HudChip size="sm" tone={rarity.tone}>
            {rarity.label}
          </HudChip>
          {mineSale && (
            <HudChip size="sm" tone="gold">
              Ma vente
            </HudChip>
          )}
          {leading && (
            <HudChip size="sm" tone="mint">
              En tête
            </HudChip>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
          <span>vendeur {a.sellerPseudo}</span>
          <span className="inline-flex items-center gap-1">
            {a.bid > 0 ? "meilleure" : "mise à prix"} <Price res={a.res} value={a.bid > 0 ? a.bid : a.startPrice} className="text-slate-100" />
          </span>
          {a.bid > 0 && <span>par {a.bidderPseudo} · <span className="font-mono tabular-nums">{a.bids}</span> enchère{a.bids > 1 ? "s" : ""}</span>}
          <span className={cn("inline-flex items-center gap-1 font-mono", left < AUCTION_RULES.antiSnipeMs ? "text-ember-glow" : "text-slate-400")}>
            <Timer className="h-3 w-3" aria-hidden /> {left > 0 ? formatDuration(left / 1000) : "clôture…"}
          </span>
        </p>
      </div>
      {mineSale ? (
        canCancel(a) && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void cancel()}>
            <X className="h-3.5 w-3.5" /> Annuler
          </Button>
        )
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <NumberInput size="sm" quick={false} min={min} step={currencyKind(a.res) === "common" ? resourceStep(Math.max(1000, min * 10)) : 1} value={value} onChange={setAmount} className="w-36" aria-label="Montant de l'enchère" />
          <Button size="sm" variant="secondary" disabled={busy || left <= 0 || need > stock} title={need > stock ? `Il te manque ${formatNumber(need - stock)} ${currencyLabel(a.res).toLowerCase()}.` : undefined} onClick={() => void bid()}>
            <Gavel className="h-3.5 w-3.5" /> {leading ? "Surenchérir" : "Enchérir"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Onglet « Enchères » de la page Commerce. */
export function AuctionSection() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const uid = player?.uid;
  const { open, closed, loaded } = useAuctions(uid);
  const [filter, setFilter] = useState<"all" | AuctionKind | "mine">("all");
  const now = Date.now();
  if (!player || !uid) return null;

  const visible = open.filter((a) => (filter === "all" ? true : filter === "mine" ? a.sellerId === uid || a.bidderId === uid : a.kind === filter));
  const leadingCount = open.filter((a) => a.bidderId === uid).length;
  const mySales = open.filter((a) => a.sellerId === uid).length;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        Reliques et plans de modules au plus offrant, en ressources ou en Ambre. Ta mise est prélevée tout de suite et rendue si quelqu'un surenchérit ; une enchère dans les 5
        dernières minutes prolonge la vente.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Ventes ouvertes" value={formatNumber(open.length)} tone="accent" />
        <StatTile label="En tête sur" value={formatNumber(leadingCount)} tone="mint" />
        <StatTile label="Mes ventes" value={`${mySales} / ${AUCTION_RULES.maxOpenPerSeller}`} tone="gold" />
        <StatTile label="Taxe au pot" value={`${Math.round(AUCTION_RULES.taxRate * 100)} %`} tone="neutral" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <HudPanel
          icon={<Gavel />}
          title="Ventes en cours"
          aside={
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "Tout"],
                  ["relic", "Reliques"],
                  ["module", "Plans"],
                  ["mine", "Les miennes"],
                ] as const
              ).map(([k, label]) => (
                <HudChip key={k} size="sm" tone={filter === k ? "accent" : "neutral"} onClick={() => setFilter(k)} aria-pressed={filter === k}>
                  {label}
                </HudChip>
              ))}
            </div>
          }
        >
          {loaded && visible.length === 0 && (
            <EmptyState icon="🔨" title="Aucune vente" className="p-0">
              {filter === "all" ? "Personne ne vend pour l'instant : sois le premier à mettre une relique ou un plan aux enchères." : "Rien dans ce filtre."}
            </EmptyState>
          )}
          <div className="flex flex-col gap-2">
            {visible.map((a) => (
              <AuctionRow key={a.id} a={a} uid={uid} now={now} />
            ))}
          </div>
        </HudPanel>

        <div className="flex min-w-0 flex-col gap-4">
          <SellPanel />
          <HudPanel icon={<History />} title="Mes ventes et mises closes" tone="muted">
            {closed.length === 0 ? (
              <p className="text-sm text-slate-500">Rien de clos pour l'instant.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-white/5">
                {closed.map((a) => {
                  const won = a.status === "sold" && a.bidderId === uid;
                  const sold = a.status === "sold" && a.sellerId === uid;
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                      {won ? <Trophy className="h-4 w-4 text-gold-glow" aria-hidden /> : <Gavel className="h-4 w-4 text-slate-500" aria-hidden />}
                      <span className="min-w-0 flex-1 truncate text-slate-200">{a.label}</span>
                      <HudChip size="sm" tone={won || sold ? "mint" : a.status === "sold" ? "danger" : "neutral"}>
                        {won ? "Remportée" : sold ? "Vendue" : a.status === "sold" ? "Perdue" : a.status === "cancelled" ? "Annulée" : "Sans preneur"}
                      </HudChip>
                      {a.status === "sold" && <Price res={a.res} value={sold ? a.bid - a.tax : a.bid} className="text-xs text-slate-300" />}
                      <span className="font-mono text-[11px] text-slate-500">{timeAgo(a.closedAtMs)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </HudPanel>
          <HudCallout tone="neutral" className="text-xs text-slate-400">
            Une relique vendue part avec sa rareté ; un plan reste à fabriquer chez l'acheteur. Un objet remporté entre dans ton inventaire même s'il est plein.
          </HudCallout>
        </div>
      </div>
    </div>
  );
}
