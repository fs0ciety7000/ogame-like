import { ResourceSelect } from "@/components/game/ResourceSelect";
import { HudPanel, Pager, usePaged } from "@/components/ui/panel";
import { PlayerName } from "@/components/ui/player-name";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Clock, History, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput, resourceStep } from "@/components/ui/number-input";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { buyOrderPaid, MARKET_RULES, marketTax, priceBounds, type MarketOffer } from "@/game/market";
import { RESOURCE_LIST } from "@/game/resources";
import { acceptMarketOffer, cancelMarketOffer, createMarketOffer, fetchMarketTrades, subscribeOffers } from "@/services/marketService";
import { MarketPriceChart, formatRatio } from "@/components/game/MarketPriceChart";
import { MARKET_HISTORY_RULES, priceFlag } from "@/game/marketHistory";
import { GameActionError } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatCompact, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

const resName = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id;

function Amount({ res, n, className }: { res: string; n: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", className)} title={`${formatNumber(n)} ${resName(res)}`}>
      <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n)}
    </span>
  );
}

function errorText(err: unknown, fallback: string) {
  return err instanceof GameActionError ? err.message : fallback;
}

/** 5.26 : section « Marché » de la page Commerce (offres et ordres d'achat). */
export function MarketSection() {
  const uid = useAuthStore((s) => s.user?.uid);
  const player = usePlayerStore((s) => s.player);
  const [data, setData] = useState<{ open: MarketOffer[]; mine: MarketOffer[] }>({ open: [], mine: [] });
  const [giveRes, setGiveRes] = useState<ResourceId>("scrap");
  const [wantRes, setWantRes] = useState<ResourceId>("energy");
  const [giveAmount, setGiveAmount] = useState(0);
  const [wantAmount, setWantAmount] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  // v5.1 : « sell » = je donne X contre Y ; « buy » = ordre d'achat, je paie X (réservé) pour recevoir Y, rempli en plusieurs fois.
  const [mode, setMode] = useState<"sell" | "buy">("sell");
  const [fillQty, setFillQty] = useState<Record<string, number>>({});

  useEffect(() => {
    return subscribeOffers(setData);
  }, []);
  // v4.8 : échanges conclus (historique des prix), rechargés quand le marché bouge.
  const [trades, setTrades] = useState<Awaited<ReturnType<typeof fetchMarketTrades>>>([]);
  const filledCount = data.mine.filter((o) => o.status === "filled").length + data.open.length;
  useEffect(() => {
    void fetchMarketTrades().then(setTrades).catch(() => undefined);
  }, [filledCount]);
  const now = Date.now();

  const bounds = giveAmount > 0 && giveRes !== wantRes ? priceBounds(giveRes, giveAmount, wantRes) : null;
  const priceOk = !!bounds && wantAmount >= bounds.min && wantAmount <= bounds.max;
  const myOpen = data.open.filter((o) => o.sellerId === uid);
  const others = useMemo(
    () => data.open.filter((o) => o.sellerId !== uid && (!filter || o.giveRes === filter || o.wantRes === filter)),
    [data.open, uid, filter],
  );
  // 5.15.12 : 20 offres à la fois.
  // 5.24 : offres paginées (taille des Réglages).
  const offersPage = usePaged(others, undefined, filter);
  const shownOffers = offersPage.items;

  if (!player) return null;
  const have = (res: string) => player.resources[res as ResourceId] ?? 0;

  const publish = async () => {
    setBusy("create");
    try {
      await createMarketOffer({ giveRes, giveAmount, wantRes, wantAmount, kind: mode });
      toast.success(mode === "buy" ? "Ordre d'achat publié : le paiement est réservé, les vendeurs peuvent le remplir en plusieurs fois." : "Offre publiée : la marchandise est mise de côté jusqu'à la vente.");
      setGiveAmount(0);
      setWantAmount(0);
    } catch (err) {
      toast.error(errorText(err, "Publication impossible."));
    } finally {
      setBusy(null);
    }
  };

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error(errorText(err, "Action impossible."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <h2 className="hud-title text-sm">{mode === "buy" ? "Passer un ordre d'achat" : "Publier une offre"}</h2>
            <div className="ml-auto flex border border-white/10 text-[11px] font-semibold font-display uppercase tracking-[0.1em]">
              {(["sell", "buy"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={cn("px-2.5 py-1 transition-colors", mode === m ? "bg-cyan-glow/15 text-cyan-glow" : "text-slate-500 hover:text-slate-300")}>
                  {m === "sell" ? "Vendre" : "Acheter"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="hud-eyebrow text-[11px] text-slate-500">{mode === "buy" ? "Je paie (réservé dès l'ordre)" : "Je donne"}</p>
            <div className="flex gap-2">
              <ResourceSelect value={giveRes} onChange={setGiveRes} ariaLabel="Ressource donnée" className="min-w-0 flex-1" size="sm" />
              <NumberInput size="sm" value={giveAmount} max={Math.max(0, Math.floor(have(giveRes)))} step={resourceStep(have(giveRes))} onChange={setGiveAmount} className="w-44" aria-label="Quantité donnée" />
            </div>
            <button type="button" className="self-end font-mono text-[11px] text-slate-500 hover:text-cyan-glow" onClick={() => setGiveAmount(Math.floor(have(giveRes)))}>
              Stock : {formatCompact(have(giveRes))}
            </button>
            <p className="hud-eyebrow text-[11px] text-slate-500">{mode === "buy" ? "Pour acheter" : "Contre"}</p>
            <div className="flex gap-2">
              <ResourceSelect value={wantRes} onChange={setWantRes} ariaLabel="Ressource demandée" className="min-w-0 flex-1" size="sm" />
              <NumberInput size="sm" quick={false} step={resourceStep(Math.max(100, wantAmount * 10))} value={wantAmount} onChange={setWantAmount} className="w-44" aria-label="Quantité demandée" />
            </div>
          </div>
          {bounds && (
            <div className="text-xs text-slate-400">
              <p>
                Prix accepté : entre <strong className="text-slate-200">{formatNumber(bounds.min)}</strong> et <strong className="text-slate-200">{formatNumber(bounds.max)}</strong> {resName(wantRes).toLowerCase()}{" "}
                <button type="button" className="text-cyan-glow hover:underline" onClick={() => setWantAmount(bounds.reference)}>
                  (taux du comptoir : {formatNumber(bounds.reference)})
                </button>
              </p>
              {wantAmount > 0 && (
                <p className={cn("mt-1", priceOk ? "text-slate-400" : "text-danger-glow")}>
                  {priceOk ? `Tu recevras ${formatNumber(wantAmount - marketTax(wantAmount, false))} après la taxe.` : "Prix hors limites."}
                </p>
              )}
            </div>
          )}
          {giveRes === wantRes && <p className="text-xs text-danger-glow">Choisis deux ressources différentes.</p>}
          <Button disabled={busy !== null || !priceOk || giveAmount > have(giveRes) || myOpen.length >= MARKET_RULES.maxOpenOffers} onClick={() => void publish()}>
            Publier ({myOpen.length}/{MARKET_RULES.maxOpenOffers})
          </Button>
          <p className="text-[11px] text-slate-500">
            {mode === "buy"
              ? `Le paiement est réservé dès l'ordre. Les vendeurs le remplissent en une ou plusieurs livraisons, payées au prorata ; la taxe porte sur ce que tu reçois. Au bout de ${MARKET_RULES.offerHours} h, la part non dépensée te revient.`
              : `La marchandise est bloquée dès la publication. Sans preneur sous ${MARKET_RULES.offerHours} h, elle te revient automatiquement. Le comptoir automatique reste disponible dans Ressources.`}
          </p>

          {myOpen.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="hud-eyebrow text-[11px] text-slate-500">Mes offres en cours</p>
              {myOpen.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-2 border border-white/5 px-2 py-1.5 text-xs">
                  {o.kind === "buy" && <HudTag tone="accent">Achat</HudTag>}
                  <Amount res={o.giveRes} n={o.giveAmount} />
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <Amount res={o.wantRes} n={o.wantAmount} />
                  {o.kind === "buy" && (o.filled ?? 0) > 0 && <span className="font-mono text-[11px] text-mint-glow">{Math.round(((o.filled ?? 0) / o.wantAmount) * 100)} % reçu</span>}
                  <span className="ml-auto flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" /> {formatDuration(Math.max(0, Math.floor((o.expiresAtMs - Date.now()) / 1000)))}
                  </span>
                  <button type="button" disabled={busy !== null} onClick={() => void run(o.id, () => cancelMarketOffer(o.id), "Offre annulée, marchandise rendue.")} className="font-mono text-[11px] uppercase text-danger-glow hover:underline">
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <HudPanel icon={<Store />} title="Offres disponibles" tone="accent" aside={<ResourceSelect<string> value={filter} onChange={setFilter} ariaLabel="Filtrer par ressource" allLabel="Toutes les ressources" size="sm" className="w-52" />}>
          {others.length === 0 ? (
            <EmptyState icon={<Store className="h-5 w-5" />} title="Aucune offre">Publie la première !</EmptyState>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {shownOffers.map((o) => {
                const affordable = have(o.wantRes) >= o.wantAmount;
                const ally = !!o.sellerAllianceId && o.sellerAllianceId === player.allianceId;
                const flag = priceFlag(o, trades, now);
                return (
                  <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-xs text-slate-400">
                      <PlayerName uid={o.sellerId} pseudo={o.sellerPseudo} allianceId={o.sellerAllianceId || null} />
                      {ally && <HudTag tone="mint" className="ml-1.5">Allié</HudTag>}
                    </span>
                    {o.kind === "buy" ? (
                      <span className="flex items-center gap-2">
                        <HudTag tone="accent">Achète</HudTag>
                        <Amount res={o.wantRes} n={o.wantAmount} />
                        <span className="text-[11px] font-mono uppercase text-slate-500">paie</span>
                        <Amount res={o.giveRes} n={o.giveAmount} className="text-mint-glow" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase text-slate-500">tu reçois</span>
                        <Amount res={o.giveRes} n={o.giveAmount} className="text-mint-glow" />
                        <span className="text-[11px] font-mono uppercase text-slate-500">contre</span>
                        <Amount res={o.wantRes} n={o.wantAmount} />
                      </span>
                    )}
                    {flag && (
                      <span title={`${formatRatio(flag.factor)} le prix habituel des ${MARKET_HISTORY_RULES.days} derniers jours`}>
                        <HudTag tone={flag.kind === "high" ? "danger" : "gold"}>{flag.kind === "high" ? "Prix anormal : cher" : "Prix anormal : bradé"}</HudTag>
                      </span>
                    )}
                    {o.kind === "buy" ? (
                      (() => {
                        const remaining = o.wantAmount - (o.filled ?? 0);
                        const qty = Math.min(remaining, fillQty[o.id] ?? Math.min(remaining, Math.floor(have(o.wantRes))));
                        const pay = buyOrderPaid(o, (o.filled ?? 0) + qty) - buyOrderPaid(o, o.filled ?? 0);
                        return (
                          <span className="ml-auto flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-500">reste {formatCompact(remaining)}</span>
                            <NumberInput size="sm" value={qty} max={remaining} step={resourceStep(remaining)} onChange={(v) => setFillQty((f) => ({ ...f, [o.id]: v }))} className="w-40" aria-label="Quantité livrée" />
                            <Button size="sm" disabled={busy !== null || qty <= 0 || pay <= 0 || have(o.wantRes) < qty} title={`Tu reçois ${formatNumber(pay)} ${resName(o.giveRes).toLowerCase()}`} onClick={() => void run(o.id, () => acceptMarketOffer(o.id, qty), `Livré : +${formatNumber(pay)} ${resName(o.giveRes).toLowerCase()}.`)}>
                              Livrer
                            </Button>
                          </span>
                        );
                      })()
                    ) : (
                      <span className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{timeAgo(o.createdAtMs)}</span>
                        {/* 6.14.68 (UX-7) : raison visible (le title ne s'affiche pas au toucher). */}
                        {!affordable && (
                          <span className="text-[11px] text-ember-glow">
                            il manque <span className="font-mono tabular-nums">{formatNumber(o.wantAmount - have(o.wantRes))}</span>
                          </span>
                        )}
                        <Button size="sm" disabled={busy !== null || !affordable} title={affordable ? undefined : `Il te manque ${formatNumber(o.wantAmount - have(o.wantRes))} ${resName(o.wantRes).toLowerCase()}`} onClick={() => void run(o.id, () => acceptMarketOffer(o.id), "Échange conclu !")}>
                          Accepter
                        </Button>
                      </span>
                    )}
                  </div>
                );
              })}
              <Pager {...offersPage.pager} />
            </div>
          )}
          <p className="text-[11px] text-slate-500">{MARKET_RULES.maxBuysPerDay} achats au plus par jour.</p>
        </HudPanel>
      </div>

      <MarketPriceChart trades={trades} now={now} />

      {data.mine.length > 0 && (
        <HudPanel icon={<History />} title="Historique">
          <div className="flex flex-col divide-y divide-white/5 text-xs">
            {data.mine.map((o) => {
              const sold = o.sellerId === uid;
              const label =
                o.kind === "buy"
                  ? o.status === "filled"
                    ? sold
                      ? "Ordre d'achat complété"
                      : `Livré à ${o.sellerPseudo}`
                    : o.status === "expired"
                      ? `Ordre expiré (${Math.round(((o.filled ?? 0) / o.wantAmount) * 100)} % reçu)`
                      : "Ordre annulé"
                  : o.status === "filled"
                    ? sold
                      ? `Vendu à ${o.buyerPseudo}`
                      : `Acheté à ${o.sellerPseudo}`
                    : o.status === "expired"
                      ? "Expirée, rendue"
                      : "Annulée";
              return (
                <div key={o.id} className="flex flex-wrap items-center gap-2 py-2">
                  <HudTag tone={o.status === "filled" ? "mint" : "gold"}>{label}</HudTag>
                  <Amount res={o.giveRes} n={o.giveAmount} />
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <Amount res={o.wantRes} n={o.wantAmount} />
                  {sold && o.tax > 0 && <span className="text-slate-500">taxe {formatCompact(o.tax)}</span>}
                  <span className="ml-auto text-slate-500">{timeAgo(o.filledAtMs || o.createdAtMs)}</span>
                </div>
              );
            })}
          </div>
        </HudPanel>
      )}
    </div>
  );
}
