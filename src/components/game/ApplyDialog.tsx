import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ALLIANCE_PROFILE_RULES } from "@/game/allianceProfile";
import { AllianceError, applyToAlliance } from "@/services/allianceService";
import type { Alliance } from "@/types/game";

/** v5.10.5 : candidature à une alliance qui recrute sur candidature. */
export function ApplyDialog({ alliance, onClose }: { alliance: Pick<Alliance, "id" | "tag" | "name"> | null; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!alliance) return;
    setBusy(true);
    try {
      await applyToAlliance(alliance.id, message);
      toast.success("Candidature envoyée : l'alliance a été prévenue.");
      setMessage("");
      onClose();
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!alliance} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>
          Postuler à [{alliance?.tag}] {alliance?.name}
        </DialogTitle>
        <p className="text-sm text-slate-400">Un mot pour te présenter (facultatif) : tes horaires, ton style de jeu, ce que tu cherches.</p>
        <textarea
          value={message}
          maxLength={ALLIANCE_PROFILE_RULES.messageMax}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-2 w-full border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/60"
          aria-label="Message de candidature"
        />
        <Button className="mt-3 w-full" disabled={busy} onClick={() => void send()}>
          <Send className="mr-1.5 h-4 w-4" /> Envoyer ma candidature
        </Button>
      </DialogContent>
    </Dialog>
  );
}
