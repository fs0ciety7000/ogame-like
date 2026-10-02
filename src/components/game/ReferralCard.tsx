import { useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REFERRAL_RULES, referralLink, referralState } from "@/game/referral";
import { declareSponsor } from "@/services/referralService";
import { GameActionError } from "@/services/playerService";
import type { PlayerState } from "@/types/game";

/* v4.1 : lien de parrainage, filleuls récompensés, parrain déclaré. */

export function ReferralCard({ player }: { player: PlayerState }) {
  const st = referralState(player);
  const link = referralLink(window.location.origin, player.uid);
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = st.monthly?.[month] ?? 0;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const canDeclare = !st.by && Date.now() - (player.createdAtMs ?? 0) < REFERRAL_RULES.linkWindowHours * 3600_000;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien copié : partage-le à tes amis.");
    } catch {
      toast.error("Copie impossible : sélectionne le lien à la main.");
    }
  };
  const declare = async () => {
    const id = code.trim().split("parrain=").pop() ?? "";
    if (!id) return;
    setBusy(true);
    try {
      const out = await declareSponsor(id);
      toast.success(`Parrain enregistré : ${out.sponsor}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Parrain introuvable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm text-white">
        <UserPlus className="h-4 w-4 text-gold-glow" /> Parrainage
      </h3>
      <p className="text-sm text-slate-400">
        Invite un ami avec ton lien. Quand il atteint <strong className="text-slate-200">Bronze I</strong>, tu reçois{" "}
        <strong className="text-gold-glow">{REFERRAL_RULES.amberSponsor} Ambre</strong> et la bannière « Recruteur », lui{" "}
        <strong className="text-gold-glow">{REFERRAL_RULES.amberRecruit} Ambre</strong>. {REFERRAL_RULES.perMonth} filleuls récompensés par mois au plus.
      </p>
      <div className="flex gap-2">
        <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={() => void copy()}>
          <Copy className="h-4 w-4" /> Copier
        </Button>
      </div>
      <p className="flex flex-wrap gap-x-4 text-xs text-slate-400">
        <span>
          <Gift className="mr-1 inline h-3.5 w-3.5 text-gold-glow" />
          Filleuls récompensés : <strong className="text-white">{st.recruits ?? 0}</strong>
        </span>
        <span>
          Ce mois-ci : {thisMonth} / {REFERRAL_RULES.perMonth}
        </span>
        {st.by && (
          <span>
            Ton parrain : <strong className="text-white">{st.byPseudo}</strong>
            {st.rewarded ? " · récompense reçue" : " · récompense à Bronze I"}
          </span>
        )}
      </p>
      {canDeclare && (
        <div className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Lien ou code de ton parrain (48 h après l'inscription)" className="text-xs" />
          <Button variant="outline" disabled={busy || !code.trim()} onClick={() => void declare()}>
            Valider
          </Button>
        </div>
      )}
    </Card>
  );
}
