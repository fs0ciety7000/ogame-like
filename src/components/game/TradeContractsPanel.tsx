import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { playerCargoCapacity } from "@/game/modifiers";
import { toast } from "sonner";
import { ArrowRight, Clock, FileSignature, Handshake, Send, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PlayerName } from "@/components/ui/player-name";
import { ResourceSelect } from "@/components/game/ResourceSelect";
import { priceBounds } from "@/game/market";
import { contractDeposit, TRADE_CONTRACT_RULES, type TradeContract } from "@/game/tradeContracts";
import { distanceBetween, fleetSpeed, travelSeconds } from "@/game/fleets";
import { allianceFlightFactor } from "@/game/alliances";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { useNowTicker } from "@/hooks/useNowTicker";
import { createTradeContract, sendDelivery, subscribeTradeContracts, tradeContractAction, type TradeContractsView } from "@/services/tradeContractService";
import { GameActionError, listAllPlayers } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatCompact, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import type { PlayerState, ResourceId } from "@/types/game";

/* v5.1 : contrats entre joueurs — « livre-moi X avant tel délai contre Y ». */

const resName = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name.toLowerCase() ?? id;
const HOURS = [4, 8, 12, 24, 48, 72];

function errorText(err: unknown, fallback: string) {
  return err instanceof GameActionError || err instanceof Error ? err.message : fallback;
}

function Amount({ res, n, className }: { res: string; n: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", className)}>
      <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n)}
    </span>
  );
}

const STATUS: Record<string, { label: string; tone: "accent" | "gold" | "mint" | "danger" | "ember" }> = {
  open: { label: "Ouvert", tone: "accent" },
  accepted: { label: "En cours", tone: "gold" },
  delivered: { label: "Honoré", tone: "mint" },
  failed: { label: "Non honoré", tone: "danger" },
  cancelled: { label: "Annulé", tone: "ember" },
  expired: { label: "Expiré", tone: "ember" },
};

function DeliveryDialog({ contract, player, onClose }: { contract: TradeContract | null; player: PlayerState; onClose: () => void }) {
  const [ships, setShips] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  if (!contract) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0 && (findUnit(id)?.stats.cargo ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(ships).filter(([, n]) => n > 0));
  const capacity = playerCargoCapacity(player, selected);
  const speed = Object.keys(selected).length ? fleetSpeed(player.units, selected) : 0;
  const trip = speed > 0 ? travelSeconds(distanceBetween(player.uid, contract.clientUid), speed, allianceFlightFactor(player.allianceResearch, player.techLevels, player)) : 0;
  const late = speed > 0 && Date.now() + trip * 1000 > contract.deadlineMs;
  const stockOk = (player.resources[contract.wantRes] ?? 0) >= contract.wantAmount;
  const send = async () => {
    setBusy(true);
    try {
      await sendDelivery(contract.id, selected);
      toast.success(`Livraison en route vers ${contract.clientPseudo}.`);
      setShips({});
      onClose();
    } catch (err) {
      toast.error(errorText(err, "Départ impossible."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Livrer {contract.clientPseudo}</DialogTitle>
        <DialogDescription>
          La cargaison ({formatNumber(contract.wantAmount)} {resName(contract.wantRes)}) part avec la flotte et doit arriver avant l'échéance, dans {formatDuration(Math.max(0, Math.floor((contract.deadlineMs - Date.now()) / 1000)))}.
        </DialogDescription>
        <div className="mt-2 flex flex-col gap-1.5">
          {ids.length === 0 && <p className="text-xs text-slate-500">Aucun vaisseau avec une soute à la base.</p>}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <NumberInput size="sm" value={ships[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setShips((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
          <span className={capacity >= contract.wantAmount ? "text-mint-glow" : "text-ember-glow"}>
            Soute {formatCompact(capacity)} / {formatCompact(contract.wantAmount)}
          </span>
          <span className={late ? "text-ember-glow" : "text-slate-400"}>{speed > 0 ? `Trajet ${formatDuration(trip)}${late ? " : trop lent" : ""}` : "Choisis des vaisseaux"}</span>
        </div>
        {!stockOk && <p className="text-xs text-ember-glow">Il te manque {formatNumber(contract.wantAmount - (player.resources[contract.wantRes] ?? 0))} {resName(contract.wantRes)}.</p>}
        <Button className="mt-3 w-full" disabled={busy || capacity < contract.wantAmount || late || !stockOk} onClick={() => void send()}>
          <Truck className="h-4 w-4" /> Envoyer la livraison
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function TradeContractsPanel() {
  useNowTicker();
  const uid = useAuthStore((s) => s.user?.uid);
  const player = usePlayerStore((s) => s.player);
  const [data, setData] = useState<TradeContractsView>({ open: [], mine: [] });
  const [wantRes, setWantRes] = useState<ResourceId>("nano");
  const [payRes, setPayRes] = useState<ResourceId>("scrap");
  const [wantAmount, setWantAmount] = useState(0);
  const [payAmount, setPayAmount] = useState(0);
  const [hours, setHours] = useState(24);
  const [targetUid, setTargetUid] = useState("");
  const [players, setPlayers] = useState<{ uid: string; pseudo: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<TradeContract | null>(null);

  useEffect(() => subscribeTradeContracts(setData), []);
  useEffect(() => {
    listAllPlayers()
      .then((list) => setPlayers(list.filter((p) => p.uid !== uid && !p.npc).map((p) => ({ uid: p.uid, pseudo: p.pseudo }))))
      .catch(() => setPlayers([]));
  }, [uid]);

  const now = Date.now();
  const active = useMemo(() => data.mine.filter((c) => (c.clientUid === uid && (c.status === "open" || c.status === "accepted")) || (c.supplierUid === uid && c.status === "accepted")).length, [data.mine, uid]);
  if (!player) return null;
  const bounds = payAmount > 0 && wantRes !== payRes ? priceBounds(payRes, payAmount, wantRes) : null;
  const priceOk = !!bounds && wantAmount >= bounds.min && wantAmount <= bounds.max;
  const canPay = (player.resources[payRes] ?? 0) >= payAmount;

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="hud-title flex items-center gap-2 text-sm">
          <FileSignature className="h-4 w-4 text-cyan-glow" /> Proposer un contrat
        </h2>
        <p className="hud-eyebrow text-[10px] text-slate-500">Livre-moi</p>
        <div className="flex gap-2">
          <ResourceSelect value={wantRes} onChange={setWantRes} ariaLabel="Ressource à livrer" className="min-w-0 flex-1" size="sm" />
          <NumberInput size="sm" stepper={false} quick={false} value={wantAmount} onChange={setWantAmount} className="w-40" aria-label="Quantité à livrer" />
        </div>
        <p className="hud-eyebrow text-[10px] text-slate-500">Contre (bloqué dès la publication)</p>
        <div className="flex gap-2">
          <ResourceSelect value={payRes} onChange={setPayRes} ariaLabel="Ressource payée" className="min-w-0 flex-1" size="sm" />
          <NumberInput size="sm" stepper={false} quick={false} value={payAmount} onChange={setPayAmount} className="w-40" aria-label="Paiement" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-eyebrow text-[10px] text-slate-500">Délai de livraison</span>
          {HOURS.map((h) => (
            <button key={h} type="button" onClick={() => setHours(h)} className={cn("border px-2 py-0.5 font-mono text-[11px]", hours === h ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40")}>
              {h} h
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          Réservé à (facultatif)
          <select value={targetUid} onChange={(e) => setTargetUid(e.target.value)} className="h-9 border border-white/10 bg-space-900 px-2 text-sm text-slate-200">
            <option value="">Tous les commandants</option>
            {players.map((p) => (
              <option key={p.uid} value={p.uid}>
                {p.pseudo}
              </option>
            ))}
          </select>
        </label>
        {bounds && (
          <p className={cn("text-xs", priceOk ? "text-slate-400" : "text-ember-glow")}>
            Pour {formatNumber(payAmount)} {resName(payRes)}, demande entre {formatNumber(bounds.min)} et {formatNumber(bounds.max)} {resName(wantRes)}{" "}
            <button type="button" className="text-cyan-glow hover:underline" onClick={() => setWantAmount(bounds.reference)}>
              (comptoir : {formatNumber(bounds.reference)})
            </button>
            .
          </p>
        )}
        <Button
          disabled={busy !== null || !priceOk || !canPay || active >= TRADE_CONTRACT_RULES.maxActive}
          onClick={() =>
            void run("create", () => createTradeContract({ wantRes, wantAmount, payRes, payAmount, hours, targetUid: targetUid || undefined }), "Contrat publié : ton paiement est bloqué jusqu'à la livraison.").then(() => {
              setWantAmount(0);
              setPayAmount(0);
            })
          }
        >
          <Send className="h-4 w-4" /> Publier ({active}/{TRADE_CONTRACT_RULES.maxActive} actifs)
        </Button>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Le livreur dépose une caution de {Math.round(TRADE_CONTRACT_RULES.depositPct * 100)} % du paiement en acceptant, puis envoie une flotte qui doit arriver à temps. S'il abandonne ou arrive en retard, tu récupères ton paiement et sa caution. Sans livreur sous {TRADE_CONTRACT_RULES.openHours} h, le contrat expire et tout t'est rendu.
        </p>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Handshake className="h-4 w-4 text-gold-glow" /> Contrats à prendre
          </h2>
          {data.open.length === 0 ? (
            <EmptyState icon={<Handshake className="h-5 w-5" />} title="Aucun contrat ouvert">
              Propose le premier !
            </EmptyState>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {data.open.map((c) => {
                const deposit = contractDeposit(c.payAmount);
                const canDeposit = (player.resources[c.payRes] ?? 0) >= deposit;
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-xs text-slate-400">
                      <PlayerName uid={c.clientUid} pseudo={c.clientPseudo} />
                      {c.targetUid && <HudTag tone="gold" className="ml-1.5">Pour toi</HudTag>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-slate-500">livre</span>
                      <Amount res={c.wantRes} n={c.wantAmount} />
                      <span className="text-[10px] uppercase text-slate-500">sous {c.hours} h, reçois</span>
                      <Amount res={c.payRes} n={c.payAmount} className="text-mint-glow" />
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500" title="Caution rendue à la livraison">
                        caution <Amount res={c.payRes} n={deposit} />
                      </span>
                      <Button size="sm" disabled={busy !== null || !canDeposit || active >= TRADE_CONTRACT_RULES.maxActive} onClick={() => void run(c.id, () => tradeContractAction("accept", c.id), "Contrat accepté : envoie ta livraison avant l'échéance.")}>
                        Accepter
                      </Button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title text-sm">Mes contrats</h2>
          {data.mine.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun contrat pour l'instant.</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {data.mine.map((c) => {
                const client = c.clientUid === uid;
                const st = STATUS[c.status] ?? STATUS.open;
                const left = c.status === "accepted" ? c.deadlineMs - now : c.status === "open" ? c.expiresAtMs - now : 0;
                return (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-xs">
                    <HudTag tone={st.tone}>{st.label}</HudTag>
                    <span className="text-slate-400">{client ? (c.supplierPseudo ? `livreur : ${c.supplierPseudo}` : "en attente d'un livreur") : `client : ${c.clientPseudo}`}</span>
                    <span className="flex items-center gap-1.5">
                      <Amount res={c.wantRes} n={c.wantAmount} />
                      <ArrowRight className="h-3 w-3 text-slate-500" />
                      <Amount res={c.payRes} n={c.payAmount} />
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      {left > 0 && (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-400">
                          <Clock className="h-3 w-3" /> {formatDuration(Math.floor(left / 1000))}
                        </span>
                      )}
                      {left <= 0 && <span className="text-slate-500">{timeAgo(c.closedAtMs || c.createdAtMs)}</span>}
                      {client && c.status === "open" && (
                        <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => void run(c.id, () => tradeContractAction("cancel", c.id), "Contrat annulé, paiement rendu.")}>
                          Annuler
                        </Button>
                      )}
                      {!client && c.status === "accepted" && !c.fleetId && (
                        <>
                          <Button size="sm" disabled={busy !== null} onClick={() => setDelivering(c)}>
                            <Truck className="h-3.5 w-3.5" /> Livrer
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => window.confirm(`Abandonner ? Ta caution de ${formatNumber(c.deposit)} ${resName(c.payRes)} reviendra à ${c.clientPseudo}.`) && void run(c.id, () => tradeContractAction("abandon", c.id), "Contrat abandonné.")}>
                            Abandonner
                          </Button>
                        </>
                      )}
                      {!client && c.status === "accepted" && c.fleetId && <span className="inline-flex items-center gap-1 text-cyan-glow"><Truck className="h-3 w-3" /> en route</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      <DeliveryDialog contract={delivering} player={player} onClose={() => setDelivering(null)} />
    </div>
  );
}
