import { useEffect, useState } from "react";
import { AmberAmount } from "@/components/ui/amber";
import { toast } from "sonner";
import { Check, Copy, Gift, Mail, UserPlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REFERRAL_RULES, referralLink, referralState } from "@/game/referral";
import { declareSponsor, fetchReferralInfo, sendVerificationEmail, type ReferralInfo } from "@/services/referralService";
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
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [mailSent, setMailSent] = useState(false);
  useEffect(() => {
    void fetchReferralInfo().then(setInfo).catch(() => undefined);
  }, [st.by, st.recruits]);
  const sendMail = async () => {
    try {
      await sendVerificationEmail();
      setMailSent(true);
      toast.success("E-mail de confirmation envoyé (pense aux spams).");
    } catch {
      toast.error("Envoi impossible pour le moment. Réessaie plus tard.");
    }
  };
  const ageDays = (createdAtMs: number) => Math.floor(((info?.now ?? Date.now()) - createdAtMs) / 86400_000);
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
        <strong className="text-gold-glow"><AmberAmount value={REFERRAL_RULES.amberSponsor} /></strong> et la bannière « Recruteur », lui{" "}
        <strong className="text-gold-glow"><AmberAmount value={REFERRAL_RULES.amberRecruit} /></strong>. {REFERRAL_RULES.perMonth} filleuls récompensés par mois au plus.
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
      {/* v4.7.1 : avancement du filleul vers la récompense. */}
      {st.by && !st.rewarded && (
        <div className="hud-cut-sm border border-white/10 bg-white/[0.02] p-3 text-xs">
          <p className="mb-2 text-slate-300">Pour la récompense de parrainage :</p>
          <ul className="flex flex-col gap-1">
            <Cond ok={(player.xp ?? 0) >= REFERRAL_RULES.rewardXp} label={`Bronze I : ${Math.min(player.xp ?? 0, REFERRAL_RULES.rewardXp).toLocaleString("fr-FR")} / ${REFERRAL_RULES.rewardXp.toLocaleString("fr-FR")} XP`} />
            <Cond ok={ageDays(player.createdAtMs ?? Date.now()) >= REFERRAL_RULES.minAgeDays} label={`Compte de ${REFERRAL_RULES.minAgeDays} jours (${Math.min(ageDays(player.createdAtMs ?? Date.now()), REFERRAL_RULES.minAgeDays)} / ${REFERRAL_RULES.minAgeDays})`} />
            <Cond ok={!!info?.verified} label="E-mail confirmé" />
          </ul>
          {info && !info.verified && (
            <Button size="sm" variant="outline" className="mt-2" disabled={mailSent} onClick={() => void sendMail()}>
              <Mail className="h-3.5 w-3.5" /> {mailSent ? "E-mail envoyé" : "Recevoir l'e-mail de confirmation"}
            </Button>
          )}
        </div>
      )}
      {info && info.recruits.length > 0 && (
        <div className="flex flex-col gap-1.5 text-xs">
          <p className="text-slate-400">Tes filleuls :</p>
          {info.recruits.map((r) => (
            <div key={r.pseudo} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded border border-white/10 bg-white/[0.02] px-2 py-1.5">
              <strong className="text-white">{r.pseudo}</strong>
              {r.rewarded ? (
                <span className="text-mint-glow">Récompense versée</span>
              ) : (
                <>
                  <span className={r.xp >= info.rules.rewardXp ? "text-mint-glow" : "text-slate-400"}>
                    {Math.min(r.xp, info.rules.rewardXp).toLocaleString("fr-FR")} / {info.rules.rewardXp.toLocaleString("fr-FR")} XP
                  </span>
                  <span className={ageDays(r.createdAtMs) >= info.rules.minAgeDays ? "text-mint-glow" : "text-slate-400"}>
                    {Math.min(ageDays(r.createdAtMs), info.rules.minAgeDays)} / {info.rules.minAgeDays} j
                  </span>
                  <span className={r.verified ? "text-mint-glow" : "text-gold-glow"}>{r.verified ? "e-mail confirmé" : "e-mail à confirmer"}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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

function Cond({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "flex items-center gap-1.5 text-mint-glow" : "flex items-center gap-1.5 text-slate-400"}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {label}
    </li>
  );
}
