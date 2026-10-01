import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Clock, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { MARKET_RULES, marketTax, priceBounds, type MarketOffer } from "@/game/market";
import { RESOURCE_LIST } from "@/game/resources";
import { acceptMarketOffer, cancelMarketOffer, createMarketOffer, subscribeOffers } from "@/services/marketService";
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

function ResourceSelect({ value, onChange, label }: { value: ResourceId; onChange: (r: ResourceId) => void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as ResourceId)} className="h-9 min-w-0 flex-1 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
      {RESOURCE_LIST.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}

function errorText(err: unknown, fallback: string) {
  return err instanceof GameActionError ? err.message : fallback;
}

export function MarketPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const player = usePlayerStore((s) => s.player);
  const [data, setData] = useState<{ open: MarketOffer[]; mine: MarketOffer[] }>({ open: [], mine: [] });
  const [giveRes, setGiveRes] = useState<ResourceId>("scrap");
  const [wantRes, setWantRes] = useState<ResourceId>("energy");
  const [giveAmount, setGiveAmount] = useState(0);
  const [wantAmount, setWantAmount] = useState(0);
  const [filter, setFilter] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => subscribeOffers(setData), []);

  const bounds = giveAmount > 0 && giveRes !== wantRes ? priceBounds(giveRes, giveAmount, wantRes) : null;
  const priceOk = !!bounds && wantAmount >= bounds.min && wantAmount <= bounds.max;
  const myOpen = data.open.filter((o) => o.sellerId === uid);
  const others = useMemo(() => data.open.filter((o) => o.sellerId !== uid && (!filter || o.giveRes === filter || o.wantRes === filter)), [data.open, uid, filter]);

  if (!player) return null;
  const have = (res: string) => player.resources[res as ResourceId] ?? 0;

  const publish = async () => {
    setBusy("create");
    try {
      await createMarketOffer({ giveRes, giveAmount, wantRes, wantAmount });
      toast.success("Offre publiée : la marchandise est mise de côté jusqu'à la vente.");
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
      <PageHeader
        eyebrow="Cosmic Empires / Opérations"
        title="Marché"
        description={`Échange tes surplus avec les autres commandants. Taxe de ${Math.round(MARKET_RULES.taxPct * 100)} % sur la vente (${Math.round(MARKET_RULES.allianceTaxPct * 100)} % entre membres d'une alliance), retirée du jeu.`}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title text-sm">Publier une offre</h2>
          <div className="flex flex-col gap-2">
            <p className="hud-eyebrow text-[10px] text-slate-500">Je donne</p>
            <div className="flex gap-2">
              <ResourceSelect value={giveRes} onChange={setGiveRes} label="Ressource donnée" />
              <Input type="number" min={0} value={giveAmount || ""} placeholder="0" onChange={(e) => setGiveAmount(Math.max(0, parseInt(e.target.value) || 0))} className="h-9 w-32 text-right" aria-label="Quantité donnée" />
            </div>
            <button type="button" className="self-end font-mono text-[10px] text-slate-500 hover:text-cyan-glow" onClick={() => setGiveAmount(Math.floor(have(giveRes)))}>
              Stock : {formatCompact(have(giveRes))}
            </button>
            <p className="hud-eyebrow text-[10px] text-slate-500">Contre</p>
            <div className="flex gap-2">
              <ResourceSelect value={wantRes} onChange={setWantRes} label="Ressource demandée" />
              <Input type="number" min={0} value={wantAmount || ""} placeholder="0" onChange={(e) => setWantAmount(Math.max(0, parseInt(e.target.value) || 0))} className="h-9 w-32 text-right" aria-label="Quantité demandée" />
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
            La marchandise est bloquée dès la publication. Sans preneur sous {MARKET_RULES.offerHours} h, elle te revient automatiquement. Le comptoir automatique reste disponible dans Ressources.
          </p>

          {myOpen.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="hud-eyebrow text-[10px] text-slate-500">Mes offres en cours</p>
              {myOpen.map((o) => (
                <div key={o.id} className="flex items-center gap-2 border border-white/5 px-2 py-1.5 text-xs">
                  <Amount res={o.giveRes} n={o.giveAmount} />
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <Amount res={o.wantRes} n={o.wantAmount} />
                  <span className="ml-auto flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" /> {formatDuration(Math.max(0, Math.floor((o.expiresAtMs - Date.now()) / 1000)))}
                  </span>
                  <button type="button" disabled={busy !== null} onClick={() => void run(o.id, () => cancelMarketOffer(o.id), "Offre annulée, marchandise rendue.")} className="font-mono text-[10px] uppercase text-danger-glow hover:underline">
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="hud-title text-sm">Offres disponibles</h2>
            <select aria-label="Filtrer par ressource" value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto h-8 border border-cyan-glow/20 bg-space-900 px-2 text-xs text-slate-300">
              <option value="">Toutes les ressources</option>
              {RESOURCE_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {others.length === 0 ? (
            <EmptyState icon={<Store className="h-5 w-5" />} title="Aucune offre">Publie la première !</EmptyState>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {others.map((o) => {
                const affordable = have(o.wantRes) >= o.wantAmount;
                const ally = !!o.sellerAllianceId && o.sellerAllianceId === player.allianceId;
                return (
                  <div key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-xs text-slate-400">
                      {o.sellerPseudo}
                      {ally && <HudTag tone="mint" className="ml-1.5">Allié</HudTag>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-slate-500">tu reçois</span>
                      <Amount res={o.giveRes} n={o.giveAmount} className="text-mint-glow" />
                      <span className="text-[10px] uppercase text-slate-500">contre</span>
                      <Amount res={o.wantRes} n={o.wantAmount} />
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{timeAgo(o.createdAtMs)}</span>
                      <Button size="sm" disabled={busy !== null || !affordable} title={affordable ? undefined : `Il te manque ${formatNumber(o.wantAmount - have(o.wantRes))} ${resName(o.wantRes).toLowerCase()}`} onClick={() => void run(o.id, () => acceptMarketOffer(o.id), "Échange conclu !")}>
                        Accepter
                      </Button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-slate-500">{MARKET_RULES.maxBuysPerDay} achats au plus par jour.</p>
        </Card>
      </div>

      {data.mine.length > 0 && (
        <Card className="p-4">
          <h2 className="hud-title mb-2 text-sm">Historique</h2>
          <div className="flex flex-col divide-y divide-white/5 text-xs">
            {data.mine.map((o) => {
              const sold = o.sellerId === uid;
              const label = o.status === "filled" ? (sold ? `Vendu à ${o.buyerPseudo}` : `Acheté à ${o.sellerPseudo}`) : o.status === "expired" ? "Expirée, rendue" : "Annulée";
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
        </Card>
      )}
    </div>
  );
}
