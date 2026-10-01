import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FACTIONS } from "@/game/pirates";
import { adminListPlayers, adminTriggerPirates, type AdminPlayer } from "@/services/adminService";

/** Envoie immédiatement l'ultimatum d'une faction à un joueur. */
export function PirateTriggerCard() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [uid, setUid] = useState("");
  const [factionId, setFactionId] = useState(FACTIONS[0]?.id ?? "varan");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminListPlayers()
      .then((list) => setPlayers([...list].sort((a, b) => a.pseudo.localeCompare(b.pseudo))))
      .catch(() => setPlayers([]));
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      const out = await adminTriggerPirates(uid, factionId);
      if (out.changed > 0) toast.success("Ultimatum envoyé : le joueur doit payer ou refuser.");
      else toast("Rien à faire : ce joueur a déjà un ultimatum ou un raid en cours.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="flex items-center gap-2 font-display text-sm text-ember-glow">
        <Skull className="h-4 w-4" /> Ultimatum de faction
      </h3>
      <p className="text-xs text-slate-400">
        Inscrit tout de suite un joueur sur la liste d'une faction : il reçoit l'ultimatum (tribut ou raid), sans attendre le déclencheur automatique. Une seule menace à la fois par joueur.
      </p>
      <div className="flex flex-wrap gap-2">
        <select value={factionId} onChange={(e) => setFactionId(e.target.value)} className="h-9 rounded-lg border border-white/10 bg-space-800/70 px-2 text-sm text-slate-100">
          {FACTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select value={uid} onChange={(e) => setUid(e.target.value)} className="h-9 flex-1 rounded-lg border border-white/10 bg-space-800/70 px-2 text-sm text-slate-100">
          <option value="">— choisir un joueur —</option>
          {players.map((p) => (
            <option key={p.uid} value={p.uid}>
              {p.pseudo}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" disabled={!uid || busy} onClick={() => void run()}>
          Envoyer l'ultimatum
        </Button>
      </div>
    </Card>
  );
}
