import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Coins, RefreshCw, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { ResourceIcon } from "@/components/ui/game-icon";
import { pb } from "@/lib/pocketbase";
import { formatCompact, formatNumber, timeAgo } from "@/lib/utils";
import { RESOURCE_LIST } from "@/game/resources";
import { POT_SOURCE_LABELS, type PotSource, type ServerPot } from "@/game/serverPot";
import { adminServerPot, adminServerPotGrant } from "@/services/serverPotService";
import type { ResourceId } from "@/types/game";

/* v5.10 : pot commun « Serveur » — solde, provenance, mouvements, et
   versement à un joueur (concours, événements). */

function Amounts({ values, sign = false }: { values: Partial<Record<string, number>>; sign?: boolean }) {
  const order = RESOURCE_LIST.map((r) => r.id as string);
  const list = Object.entries(values)
    .filter(([, v]) => (v ?? 0) !== 0)
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])) as [ResourceId, number][];
  if (list.length === 0) return <span className="text-xs text-slate-500">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {list.map(([id, v]) => (
        <span key={id} className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[11px] tabular-nums">
          <ResourceIcon id={id} /> {sign && v > 0 ? "+" : ""}
          {formatCompact(v)}
        </span>
      ))}
    </span>
  );
}

export function ServerPotPanel() {
  const [pot, setPot] = useState<ServerPot | null>(null);
  const [busy, setBusy] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [note, setNote] = useState("");
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const load = async () => {
    try {
      setPot(await adminServerPot());
    } catch (err) {
      toast.error(`Lecture impossible : ${(err as Error).message}`);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const grant = async () => {
    setBusy(true);
    try {
      const target = await pb.collection("players").getFirstListItem<{ id: string; pseudo: string }>(pb.filter("pseudo = {:p}", { p: pseudo.trim() }));
      setPot(await adminServerPotGrant(target.id, amounts, note));
      toast.success(`Versé à ${target.pseudo}.`);
      setAmounts({});
    } catch (err) {
      const msg = (err as { response?: { message?: string } })?.response?.message ?? (err as Error).message;
      toast.error(msg.includes("wasn't found") || msg.includes("404") ? "Joueur introuvable (pseudo exact)." : msg);
    } finally {
      setBusy(false);
    }
  };

  if (!pot) return <p className="text-sm text-slate-500">Chargement du pot commun…</p>;
  const sources = Object.keys(POT_SOURCE_LABELS).filter((s) => s !== "admin") as PotSource[];
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-gold-glow" />
          <h3 className="font-display text-sm text-white">Pot commun « Serveur »</h3>
          <span className="text-xs text-slate-500">{pot.updatedAtMs ? `mis à jour ${timeAgo(pot.updatedAtMs)}` : "vide pour l'instant"}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Les taxes du marché (offres et ordres d'achat) et la part perdue des cadeaux hors alliance arrivent ici au lieu de disparaître. Le pot sert aux concours et
          récompenses collectives : verse-le à un joueur ci-dessous.
        </p>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Solde</p>
          <Amounts values={pot.resources} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {sources.map((s) => (
            <div key={s} className="border border-white/[0.06] bg-white/[0.02] p-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{POT_SOURCE_LABELS[s]} (total reçu)</p>
              <Amounts values={pot.totals[s] ?? {}} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h3 className="flex items-center gap-2 font-display text-sm text-white">
          <Send className="h-4 w-4 text-cyan-glow" /> Verser à un joueur
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Pseudo exact
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="h-9 border border-white/10 bg-black/30 px-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Motif (visible par le joueur)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Concours d'Halloween" className="h-9 border border-white/10 bg-black/30 px-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50" />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {RESOURCE_LIST.filter((r) => (pot.resources[r.id] ?? 0) > 0).map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-slate-300">
                <ResourceIcon id={r.id} /> {r.name} <span className="text-xs text-slate-500">(max {formatNumber(pot.resources[r.id] ?? 0)})</span>
              </span>
              <NumberInput size="sm" max={pot.resources[r.id] ?? 0} value={amounts[r.id] ?? 0} onChange={(v) => setAmounts((a) => ({ ...a, [r.id]: v }))} className="w-36" aria-label={`Montant ${r.name}`} />
            </div>
          ))}
        </div>
        <Button className="self-start" disabled={busy || !pseudo.trim() || !note.trim()} onClick={() => void grant()}>
          Verser
        </Button>
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-sm text-white">Derniers mouvements</h3>
        {pot.log.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun mouvement.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {[...pot.log].reverse().slice(0, 40).map((l, i) => (
              <li key={`${l.atMs}-${i}`} className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-1.5 text-xs">
                <span className="w-24 shrink-0 font-mono text-slate-500">{timeAgo(l.atMs)}</span>
                <span className="w-32 shrink-0 text-slate-300">{POT_SOURCE_LABELS[l.source]}</span>
                <Amounts values={l.resources} sign />
                {l.note && <span className="text-slate-400">· {l.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
