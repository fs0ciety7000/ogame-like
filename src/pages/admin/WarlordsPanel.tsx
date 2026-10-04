import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { toast } from "sonner";
import { ChevronDown, Handshake, Play, RotateCcw, Save, Sword, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { currentGameContent } from "@/game/content";
import { PERSONALITY_LABELS, TIER_LABELS, type WarlordDef, type WarlordLineKey, type WarlordPersonality, type WarlordsConfig, type WarlordTier } from "@/game/warlords";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { fetchWarlords } from "@/services/warlordService";
import { CheckboxField, ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { formatNumber } from "@/lib/utils";

/* v4.2 : réglages et fiches des seigneurs de guerre, sans toucher au code. */

const LINE_LABELS: Record<WarlordLineKey, string> = {
  contact: "Premier contact",
  raided: "Après un pillage subi",
  won: "Après une attaque réussie",
  repelled: "Après une attaque repoussée",
  vendettaOpen: "Vendetta déclarée",
  vendettaWon: "Vendetta gagnée par le joueur",
  vendettaLost: "Vendetta perdue par le joueur",
  market: "Après un achat au marché",
  reply: "Réponse à un message",
};

async function adminCall(action: string, warlordId = "") {
  return pb.send<Record<string, number>>("/api/cosmic/admin/warlords", { method: "POST", body: { action, warlordId } });
}

export function WarlordsPanel() {
  const customized = useContentStore((s) => s.customized.includes("warlords"));
  const [cfg, setCfg] = useState<WarlordsConfig>(() => structuredClone(currentGameContent().warlords));
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [power, setPower] = useState<Record<string, { power: number; absentUntilMs: number }>>({});

  const refreshLive = () =>
    fetchWarlords()
      .then((v) => setPower(Object.fromEntries(v.warlords.map((w) => [w.id, { power: w.power, absentUntilMs: w.absentUntilMs }]))))
      .catch(() => undefined);
  useEffect(() => {
    void refreshLive();
  }, []);

  const setDef = (id: string, patch: Partial<WarlordDef>) => setCfg((c) => ({ ...c, defs: c.defs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("warlords", cfg);
      toast.success("Seigneurs enregistrés : appliqués à la prochaine tâche horaire (ou lance-la maintenant).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: string, id = "") => {
    setBusy(true);
    try {
      const s = await adminCall(action, id);
      if (action === "coalitionStart") toast.success("Coalition lancée : tous les joueurs sont prévenus.");
      else if (action === "coalitionStop") toast.success("Coalition arrêtée (comptée comme un échec).");
      else toast.success(`Tâche lancée : ${s.grown ?? 0} seigneur(s) à jour, ${s.attacks ?? 0} attaque(s), ${s.offers ?? 0} offre(s), ${s.contacts ?? 0} contact(s).`);
      await refreshLive();
    } catch (err) {
      toast.error((err as { response?: { message?: string } })?.response?.message ?? "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Seigneurs de guerre</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => confirm("Arrêter la coalition en cours ? Elle compte comme un échec.") && void run("coalitionStop")}>
            Arrêter la coalition
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run("tick")}>
            <Play className="mr-1 h-3.5 w-3.5" /> Lancer la tâche maintenant
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("warlords");
              setCfg(structuredClone(currentGameContent().warlords));
              toast.success("Seigneurs par défaut restaurés.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <Section title="Réglages globaux">
          <CheckboxField label="Seigneurs actifs" checked={cfg.settings.enabled} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, enabled: v } }))} hint="Désactivés : leurs empires sont retirés à la prochaine tâche horaire." />
          <NumberField label="Fréquence des attaques (×)" hint="1 = une attaque par 48 h et par seigneur agressif ; 0 = aucune." value={cfg.settings.attackFrequency} min={0} step={0.1} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, attackFrequency: v ?? 1 } }))} />
          <NumberField label="Puissance visée (×)" hint="Multiplie la puissance cible de tous les seigneurs." value={cfg.settings.powerFactor} min={0.1} step={0.1} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, powerFactor: v ?? 1 } }))} />
        </Section>
      </Card>

      {cfg.defs.map((d) => {
        const live = power[d.id];
        const isOpen = open === d.id;
        return (
          <Card key={d.id} className="p-0">
            <button type="button" className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen(isOpen ? null : d.id)}>
              <img src={assetUrl(d.portrait)} alt="" className="h-10 w-10 object-cover object-top" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">
                  {d.name} {!d.enabled && <span className="text-xs text-slate-500">(désactivé)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {PERSONALITY_LABELS[d.personality]} · {TIER_LABELS[d.tier]}
                  {live ? ` · puissance ${formatNumber(live.power)}` : ""}
                  {live && live.absentUntilMs > Date.now() ? " · en fuite" : ""}
                </p>
              </div>
              <ChevronDown className={isOpen ? "h-4 w-4 rotate-180 text-slate-400" : "h-4 w-4 text-slate-400"} />
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-3 border-t border-white/5 p-3 sm:grid-cols-2">
                <TextField label="Nom" value={d.name} onChange={(v) => setDef(d.id, { name: v })} />
                <CheckboxField label="Actif" checked={d.enabled} onChange={(v) => setDef(d.id, { enabled: v })} />
                <SelectField<WarlordPersonality>
                  label="Personnalité"
                  value={d.personality}
                  options={Object.entries(PERSONALITY_LABELS).map(([value, label]) => ({ value: value as WarlordPersonality, label }))}
                  onChange={(v) => setDef(d.id, { personality: v })}
                />
                <SelectField<WarlordTier>
                  label="Palier"
                  value={d.tier}
                  options={Object.entries(TIER_LABELS).map(([value, label]) => ({ value: value as WarlordTier, label }))}
                  onChange={(v) => setDef(d.id, { tier: v })}
                />
                <ImageField label="Portrait" value={d.portrait} onChange={(v) => setDef(d.id, { portrait: v })} />
                <ImageField label="Sceau" value={d.emblem} onChange={(v) => setDef(d.id, { emblem: v })} />
                <div className="sm:col-span-2">
                  <TextAreaField label="Présentation" rows={3} value={d.bio} onChange={(v) => setDef(d.id, { bio: v })} />
                </div>
                {(Object.keys(LINE_LABELS) as WarlordLineKey[]).map((key) => (
                  <TextAreaField
                    key={key}
                    label={`${LINE_LABELS[key]} (une réplique par ligne, {pseudo} = joueur)`}
                    rows={2}
                    value={(d.lines[key] ?? []).join("\n")}
                    onChange={(v) => setDef(d.id, { lines: { ...d.lines, [key]: v.split("\n").map((l) => l.trim()).filter(Boolean) } })}
                  />
                ))}
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button variant="secondary" size="sm" disabled={busy || !d.enabled} onClick={() => void run("attack", d.id)}>
                    <Sword className="mr-1 h-3.5 w-3.5" /> Forcer une attaque
                  </Button>
                  <Button variant="secondary" size="sm" disabled={busy || !d.enabled} onClick={() => confirm(`Lancer une coalition de 5 jours contre ${d.name} ?`) && void run("coalitionStart", d.id)}>
                    <Handshake className="mr-1 h-3.5 w-3.5" /> Lancer une coalition
                  </Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => confirm(`Recréer ${d.name} de zéro ?`) && void run("reset", d.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Recréer l'empire
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
