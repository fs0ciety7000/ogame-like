import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dices, Plus, Trash2, Trophy } from "lucide-react";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HudChip, HudSwitch } from "@/components/ui/hud";
import { CASINO_MODES, casinoOpen, expectedHours, nextCasinoOpening, OUTCOME_LABELS, validateCasinoSettings, type CasinoMode, type CasinoSettings } from "@/game/casino";
import { adminCasinoSettings, adminGrantTokens, refreshCasino, useCasino } from "@/services/casinoService";
import { Field, NumberField, SelectField } from "@/pages/admin/fields";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v5.12 : administration du Casino orbital — ouverture, gains, jetons offerts. */

function toLocalInput(ms: number): string {
  return new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const parisLabel = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export function CasinoAdmin() {
  const [casino] = useCasino();
  const [draft, setDraft] = useState<CasinoSettings | null>(null);
  const settings = draft ?? casino?.settings ?? null;
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState("all");
  const [pseudo, setPseudo] = useState("");
  const [tokens, setTokens] = useState(3);
  const [note, setNote] = useState("");
  const [winStart, setWinStart] = useState(() => toLocalInput(Date.now() + 3600_000));
  const [winHours, setWinHours] = useState(48);
  const errors = useMemo(() => (settings ? validateCasinoSettings(settings) : []), [settings]);
  if (!settings) return null;
  const now = Date.now();
  const open = casinoOpen(settings, now);
  const next = nextCasinoOpening(settings, now);
  const set = (patch: Partial<CasinoSettings>) => setDraft({ ...settings, ...patch });
  const rw = settings.rewards;
  const setRw = (patch: Partial<CasinoSettings["rewards"]>) => set({ rewards: { ...rw, ...patch } });
  const at = (list: number[], i: number, v: number) => {
    const out = [...list];
    while (out.length <= i) out.push(0);
    out[i] = Math.max(0, Math.min(100, v));
    return out;
  };

  const save = async () => {
    setBusy(true);
    try {
      await adminCasinoSettings(settings);
      setDraft(null);
      refreshCasino();
      toast.success("Réglages du casino enregistrés.");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const grant = async () => {
    const who = target === "player" ? pseudo.trim() : target;
    if (!who) return;
    if (!(await askConfirm({ title: `Offrir ${tokens} jeton(s) ?`, message: `Destinataires : ${target === "all" ? "tous les joueurs" : target === "active" ? "tous les joueurs actifs (7 jours)" : who}.`, confirmLabel: "Offrir", tone: "gold" }))) return;
    setBusy(true);
    try {
      const out = await adminGrantTokens(who, tokens, note);
      toast.success(`${out.tokens} jeton(s) offert(s) à ${out.players} joueur(s).`);
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Dices className="h-4 w-4 text-gold-glow" />
        <h3 className="hud-title text-sm text-slate-100">Casino orbital</h3>
        <HudChip size="sm" tone={open ? "mint" : "neutral"} alert={open}>
          {open ? "Ouvert" : "Fermé"}
        </HudChip>
        {!open && next && <span className="text-xs text-slate-400">prochaine ouverture : {parisLabel(next)}</span>}
        <span className="ml-auto text-xs text-slate-500">{casino?.totalSpins ?? 0} tirages · {casino?.jackpots.length ?? 0} gros lot(s)</span>
      </div>
      <p className="text-xs text-slate-400">
        Fermé, le casino disparaît du menu des joueurs (les administrateurs le voient toujours). À chaque ouverture, tous les joueurs sont prévenus.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField<CasinoMode> label="Ouverture" value={settings.mode} options={CASINO_MODES.map((m) => ({ value: m.id, label: m.label }))} onChange={(mode) => set({ mode })} />
        {settings.mode === "scheduled" && (
          <Field label="Ouvert chaque week-end" hint="Samedi et dimanche, heure de Paris.">
            <HudSwitch checked={settings.weekends} onCheckedChange={(weekends) => set({ weekends })} label="Week-ends" />
          </Field>
        )}
      </div>

      {settings.mode === "scheduled" && (
        <div className="hud-callout hud-tone-violet flex flex-col gap-2 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">Créneaux d'ouverture</p>
          {settings.windows.length === 0 && <p className="text-xs text-slate-500">Aucun créneau précis.</p>}
          {settings.windows.map((w, i) => (
            <p key={w.startMs} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="flex-1">
                {parisLabel(w.startMs)} → {parisLabel(w.endMs)}
              </span>
              <button type="button" title="Retirer" className="text-slate-500 hover:text-danger-glow" onClick={() => set({ windows: settings.windows.filter((_, k) => k !== i) })}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </p>
          ))}
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Début">
              <Input type="datetime-local" value={winStart} onChange={(e) => setWinStart(e.target.value)} className="h-9" />
            </Field>
            <Field label="Durée (h)">
              <Input type="number" min={1} max={720} value={winHours} onChange={(e) => setWinHours(Math.max(1, Number(e.target.value) || 1))} className="h-9 w-24" />
            </Field>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const startMs = new Date(winStart).getTime();
                if (!Number.isFinite(startMs)) return;
                set({ windows: [...settings.windows, { startMs, endMs: startMs + winHours * 3600_000 }].sort((a, b) => a.startMs - b.startMs) });
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Jetons offerts par jour" value={settings.dailyTokens} min={0} onChange={(v) => set({ dailyTokens: v ?? 0 })} />
        <NumberField label="Réserve maximale" value={settings.maxTokens} min={1} onChange={(v) => set({ maxTokens: v ?? 1 })} />
        <NumberField label="Gros lot : part du pot (%)" value={Math.round(settings.jackpotShare * 100)} min={0} onChange={(v) => set({ jackpotShare: (v ?? 0) / 100 })} />
        <NumberField label="Gros lot si pot vide (h)" value={settings.jackpotFallbackHours} min={0} onChange={(v) => set({ jackpotFallbackHours: v ?? 0 })} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(settings.odds) as (keyof CasinoSettings["odds"])[]).map((k) => (
          <div key={k} className="hud-cut-sm flex flex-col gap-1 border border-white/10 p-2">
            <p className="text-xs text-slate-200">{OUTCOME_LABELS[k]}</p>
            <NumberField label="Chance (%)" value={Math.round(settings.odds[k] * 10000) / 100} min={0} step={0.1} onChange={(v) => set({ odds: { ...settings.odds, [k]: (v ?? 0) / 100 } })} />
            {k in settings.hours && (
              <NumberField
                label="Gain (h de production)"
                value={settings.hours[k as keyof CasinoSettings["hours"]]}
                min={0}
                onChange={(v) => set({ hours: { ...settings.hours, [k]: v ?? 0 } })}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        En moyenne, un jeton rapporte {expectedHours(settings).toFixed(2)} h de production (hors gros lot), le gros lot sort une fois sur {settings.odds.jackpot > 0 ? Math.round(1 / settings.odds.jackpot) : "∞"}, et {Math.round(settings.odds.cherry * 100)} % des tirages rendent le jeton.
      </p>
      <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          <TokenIcon size={16} /> Jetons gagnés en jeu
        </p>
        <p className="text-xs text-slate-500">Le passe de saison a ses propres paliers « Jetons du casino » (onglet Passe).</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <NumberField label="Défi hebdo, palier 1" value={rw.challenge[0] ?? 0} min={0} onChange={(v) => setRw({ challenge: at(rw.challenge, 0, v ?? 0) })} />
          <NumberField label="Défi hebdo, palier 2" value={rw.challenge[1] ?? 0} min={0} onChange={(v) => setRw({ challenge: at(rw.challenge, 1, v ?? 0) })} />
          <NumberField label="Boss abattu (chacun)" value={rw.bossWin} min={0} onChange={(v) => setRw({ bossWin: v ?? 0 })} />
          <NumberField label="Boss : bonus du 1er (½ aux 2e et 3e)" value={rw.bossTop} min={0} onChange={(v) => setRw({ bossTop: v ?? 0 })} />
          <NumberField label="Boss retiré (chacun)" value={rw.bossFail} min={0} onChange={(v) => setRw({ bossFail: v ?? 0 })} />
          <NumberField label="Proie d'élite abattue (chaque chasseur)" value={rw.elite} min={0} onChange={(v) => setRw({ elite: v ?? 0 })} />
          <NumberField label="Seigneur de guerre pillé" value={rw.warlord} min={0} onChange={(v) => setRw({ warlord: v ?? 0 })} />
        </div>
        <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          <Trophy className="h-3.5 w-3.5 text-gold-glow" /> Tournoi de chaque ouverture
        </p>
        <p className="text-xs text-slate-500">Chaque tirage rapporte des points (7-7-7 : 100, trois étoiles : 30… perdu : 0). À la fermeture, le podium reçoit ses jetons et le premier porte le titre jusqu'au tournoi suivant.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2].map((i) => (
            <NumberField key={i} label={`Tournoi : ${i + 1}${i === 0 ? "er" : "e"}`} value={rw.tournament[i] ?? 0} min={0} onChange={(v) => setRw({ tournament: at(rw.tournament, i, v ?? 0) })} />
          ))}
          <Field label="Titre du vainqueur">
            <Input value={rw.tournamentTitle} maxLength={40} onChange={(e) => setRw({ tournamentTitle: e.target.value })} className="h-10" />
          </Field>
          <Field label="Titre du 7-7-7 (définitif)">
            <Input value={rw.jackpotTitle} maxLength={40} onChange={(e) => setRw({ jackpotTitle: e.target.value })} className="h-10" />
          </Field>
        </div>
      </div>

      {errors.length > 0 && <p className="text-xs text-danger-glow">{errors.join(" ")}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {draft && (
          <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
            Annuler
          </Button>
        )}
        <Button size="sm" disabled={busy || !draft || errors.length > 0} onClick={() => void save()}>
          Enregistrer
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          <TokenIcon size={16} /> Offrir des jetons
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem]">
          <SelectField
            label="Destinataires"
            value={target}
            options={[
              { value: "all", label: "Tous les joueurs" },
              { value: "active", label: "Joueurs actifs (7 jours)" },
              { value: "player", label: "Un joueur" },
            ]}
            onChange={setTarget}
          />
          {target === "player" ? (
            <Field label="Pseudo">
              <Input value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="h-10" />
            </Field>
          ) : (
            <Field label="Message (facultatif)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="Offerts par l'équipe…" className="h-10" />
            </Field>
          )}
          <NumberField label="Jetons" value={tokens} min={1} onChange={(v) => setTokens(Math.max(1, Math.min(100, v ?? 1)))} />
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={busy || (target === "player" && !pseudo.trim())} onClick={() => void grant()}>
            <TokenIcon size={16} className="mr-1" /> Offrir
          </Button>
        </div>
      </div>
    </Card>
  );
}
