import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { toast } from "sonner";
import { ChevronDown, Handshake, Play, Plus, RotateCcw, Save, Sword, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { currentGameContent } from "@/game/content";
import { DEFAULT_WARLORD_ORIGINS, PERSONALITY_LABELS, TIER_LABELS, warlordAlertRatio, validateWarlords, withDefaultOrigins, type WarlordOriginDef, type WarlordHistoryPoint, type WarlordPublic, type WarlordDef, type WarlordLineKey, type WarlordPersonality, type WarlordsConfig, type WarlordTier } from "@/game/warlords";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { fetchWarlords, type WarlordsView } from "@/services/warlordService";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { UNIT_CLASS_LABELS } from "@/game/unitClasses";
import { CheckboxField, ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { formatNumber } from "@/lib/utils";
import { normalizeRankRules, RANK_NAMES, RANK_NUMERALS, type WarlordRankRules } from "@/game/warlordRanks";
import { askConfirm } from "@/components/ui/confirm-dialog";

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

async function adminCall(action: string, warlordId = "", extra: Record<string, unknown> = {}) {
  return pb.send<Record<string, number>>("/api/cosmic/admin/warlords", { method: "POST", body: { action, warlordId, ...extra } });
}

/** 5.22 : réglages des rangs de menace et des traits. */
function RankRulesSection({ value, onChange }: { value: WarlordRankRules; onChange: (r: WarlordRankRules) => void }) {
  const set = (patch: Partial<WarlordRankRules>) => onChange({ ...value, ...patch });
  const T = value.threat;
  const O = value.traits.opportunist;
  const B = value.traits.builder;
  const pctHint = (per: number) => `Au rang V : ${Math.round(per * 4 * 100)} %.`;
  return (
    <Section title="Rangs de menace (I à V) et traits">
      <CheckboxField label="Rangs actifs" checked={value.enabled} onChange={(v) => set({ enabled: v })} hint="Désactivés : tous les seigneurs restent au rang I, sans trait." />
      {[0, 1, 2, 3].map((i) => (
        <NumberField
          key={i}
          label={`Menace pour le rang ${RANK_NUMERALS[i + 1]}`}
          value={value.thresholds[i]}
          min={1}
          onChange={(v) => set({ thresholds: value.thresholds.map((t, j) => (j === i ? (v ?? t) : t)) })}
        />
      ))}
      <NumberField label="Puissance visée par rang (+)" hint={`Au rang V : +${Math.round(value.powerPerRank * 4 * 100)} %.`} value={value.powerPerRank} min={0} step={0.01} onChange={(v) => set({ powerPerRank: v ?? 0 })} />
      <NumberField label="Menace par jour" value={T.perDay} step={0.5} onChange={(v) => set({ threat: { ...T, perDay: v ?? 0 } })} />
      <NumberField label="Menace : attaque gagnée" value={T.attackWon} step={0.5} onChange={(v) => set({ threat: { ...T, attackWon: v ?? 0 } })} />
      <NumberField label="Menace : joueur repoussé" value={T.defenseWon} step={0.5} onChange={(v) => set({ threat: { ...T, defenseWon: v ?? 0 } })} />
      <NumberField label="Menace : son attaque repoussée" hint="Valeur négative : il perd de la menace." value={T.attackLost} step={0.5} onChange={(v) => set({ threat: { ...T, attackLost: v ?? 0 } })} />
      <NumberField label="Menace : pillé par un joueur" value={T.raided} step={0.5} onChange={(v) => set({ threat: { ...T, raided: v ?? 0 } })} />
      <NumberField label="Menace : vendetta survécue" value={T.vendettaSurvived} step={0.5} onChange={(v) => set({ threat: { ...T, vendettaSurvived: v ?? 0 } })} />
      <NumberField label="Rangs perdus (vendetta gagnée)" value={value.vendettaRankLoss} min={0} onChange={(v) => set({ vendettaRankLoss: v ?? 0 })} />
      <NumberField label="Insaisissable : esquive par rang" hint={pctHint(O.evadePerRank)} value={O.evadePerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, opportunist: { ...O, evadePerRank: v ?? 0 } } })} />
      <NumberField label="Insaisissable : retraite anticipée par rang" hint={pctHint(O.retreatEarlierPerRank)} value={O.retreatEarlierPerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, opportunist: { ...O, retreatEarlierPerRank: v ?? 0 } } })} />
      <NumberField label="Insaisissable : butin par rang" hint={pctHint(O.lootPerRank)} value={O.lootPerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, opportunist: { ...O, lootPerRank: v ?? 0 } } })} />
      <NumberField label="Rempart : bouclier par rang" hint={pctHint(B.shieldPerRank)} value={B.shieldPerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, builder: { ...B, shieldPerRank: v ?? 0 } } })} />
      <NumberField label="Rempart : défenses par rang" hint={pctHint(B.defensePerRank)} value={B.defensePerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, builder: { ...B, defensePerRank: v ?? 0 } } })} />
      <NumberField label="Fureur : avantage de classe par rang" hint={pctHint(value.traits.aggressive.edgePerRank)} value={value.traits.aggressive.edgePerRank} min={0} step={0.01} onChange={(v) => set({ traits: { ...value.traits, aggressive: { edgePerRank: v ?? 0 } } })} />
      <NumberField label="Ascendant : objectif de vendetta (×)" value={value.ascendant.goalFactor} min={1} step={0.1} onChange={(v) => set({ ascendant: { ...value.ascendant, goalFactor: v ?? 1 } })} />
      <CheckboxField label="Ascendant : vendetta d'alliance seulement" checked={value.ascendant.allianceOnly} onChange={(v) => set({ ascendant: { ...value.ascendant, allianceOnly: v } })} />
      <NumberField label="Unités d'élite nécessaires pour contrer" value={value.eliteMinCount} min={1} onChange={(v) => set({ eliteMinCount: v ?? 1 })} />
    </Section>
  );
}

/** 6.14.154 (AU27, R6, reste d'AA-20) : origines des seigneurs (étiquette, image de repli, sceau, couleur de la fiche).
 *  Les cinq livrées se règlent ; une origine ajoutée se retire tant qu'aucun seigneur ne la porte. */
function OriginsSection({ cfg, setCfg }: { cfg: WarlordsConfig; setCfg: (fn: (c: WarlordsConfig) => WarlordsConfig) => void }) {
  const origins = withDefaultOrigins(cfg.origins);
  const setOrigin = (id: string, patch: Partial<WarlordOriginDef>) => setCfg((c) => ({ ...c, origins: withDefaultOrigins(c.origins).map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  const add = () =>
    setCfg((c) => {
      const list = withDefaultOrigins(c.origins);
      let id = "nouvelle_origine";
      for (let n = 2; list.some((o) => o.id === id); n++) id = `nouvelle_origine_${n}`;
      return { ...c, origins: [...list, { ...DEFAULT_WARLORD_ORIGINS[0], id, label: "Nouvelle origine" }] };
    });
  const remove = (id: string) => setCfg((c) => ({ ...c, origins: withDefaultOrigins(c.origins).filter((o) => o.id !== id) }));
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm text-slate-100">Origines</h3>
        <Button variant="outline" size="sm" className="ml-auto" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une origine
        </Button>
      </div>
      <p className="text-xs text-slate-500">Étiquette, image de repli et couleur de la fiche publique d'un seigneur. Une origine ajoutée se choisit dans la fiche du seigneur.</p>
      {origins.map((o) => {
        const delivered = DEFAULT_WARLORD_ORIGINS.some((d) => d.id === o.id);
        const used = cfg.defs.filter((d) => d.origin === o.id).map((d) => d.name);
        return (
          <div key={o.id} className="grid min-w-0 grid-cols-1 gap-2 border-t border-cyan-glow/20 pt-3 sm:grid-cols-2">
            <TextField
              label="Identifiant"
              value={o.id}
              disabled={delivered || used.length > 0}
              hint={delivered ? "Origine livrée." : used.length > 0 ? `Portée par ${used.join(", ")}.` : "Lettres, chiffres, _."}
              onChange={(id) => setCfg((c) => ({ ...c, origins: withDefaultOrigins(c.origins).map((x) => (x.id === o.id ? { ...x, id } : x)) }))}
            />
            <TextField label="Étiquette" value={o.label} onChange={(label) => setOrigin(o.id, { label })} />
            <TextField label="Image de repli (portrait)" value={o.art} onChange={(art) => setOrigin(o.id, { art })} />
            <TextField label="Sceau" value={o.emblem} onChange={(emblem) => setOrigin(o.id, { emblem })} />
            <TextField label="Couleur (#rrggbb)" value={o.color} onChange={(color) => setOrigin(o.id, { color })} />
            {!delivered && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" className="text-danger-glow" disabled={used.length > 0} title={used.length > 0 ? "Un seigneur la porte encore." : undefined} onClick={() => remove(o.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

export function WarlordsPanel() {
  const customized = useContentStore((s) => s.customized.includes("warlords"));
  const [cfg, setCfg] = useState<WarlordsConfig>(() => structuredClone(currentGameContent().warlords));
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [power, setPower] = useState<Record<string, Pick<WarlordPublic, "power" | "absentUntilMs" | "rank" | "threat" | "history" | "counter">>>({});
  const [balance, setBalance] = useState<WarlordsView["balance"]>(undefined);

  const refreshLive = () =>
    fetchWarlords()
      .then((v) => {
        setPower(Object.fromEntries(v.warlords.map((w) => [w.id, { power: w.power, absentUntilMs: w.absentUntilMs, rank: w.rank, threat: w.threat, history: w.history, counter: w.counter }])));
        setBalance(v.balance);
      })
      .catch(() => undefined);
  useEffect(() => {
    void refreshLive();
  }, []);

  // 6.14.154 (R6) : origines et fiches vérifiées avant d'enregistrer (le serveur fait la même garde).
  const errors = useMemo(() => validateWarlords(cfg), [cfg]);
  const setDef = (id: string, patch: Partial<WarlordDef>) => setCfg((c) => ({ ...c, defs: c.defs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));

  const save = async () => {
    if (errors.length > 0) {
      toast.error(`Enregistrement refusé : ${errors[0]}`);
      return;
    }
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

  const run = async (action: string, id = "", extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const s = await adminCall(action, id, extra);
      if (action === "rank") toast.success(`Rang imposé : ${RANK_NUMERALS[Number(extra.rank) - 1]}.`);
      else if (action === "coalitionStart") toast.success("Coalition lancée : tous les joueurs sont prévenus.");
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
        <h2 className="font-display text-base text-slate-100">Seigneurs de guerre</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void askConfirm({ title: "Arrêter la coalition en cours ?", message: "Elle compte comme un échec.", confirmLabel: "Arrêter", tone: "danger" }).then((ok) => { if (ok) void run("coalitionStop"); })}>
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
          <Button size="sm" disabled={busy || errors.length > 0} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      {/* 5.23 : alerte d'équilibrage : un seigneur au-delà de 1,5 fois le 2e joueur. */}
      {balance && balance.alerts.length > 0 && (
        <HudCallout tone="ember" className="text-xs">
          {balance.alerts.map((a) => (
            <span key={a.id} className="block">
              {a.name} : <span className="font-mono">{formatNumber(a.power)}</span>, soit <span className="font-mono">×{String(a.ratio).replace(".", ",")}</span> le 2e joueur (
              <span className="font-mono">{formatNumber(a.second)}</span>). Baisse la « Puissance visée » ou lance la tâche pour le recaler.
            </span>
          ))}
        </HudCallout>
      )}
      {balance && balance.alerts.length === 0 && balance.second > 0 && (
        <p className="text-xs text-slate-500">
          Aucun seigneur au-delà de ×{String(warlordAlertRatio()).replace(".", ",")} le 2e joueur (<span className="font-mono">{formatNumber(balance.second)}</span>).
        </p>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <Section title="Réglages globaux">
          <CheckboxField label="Seigneurs actifs" checked={cfg.settings.enabled} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, enabled: v } }))} hint="Désactivés : leurs empires sont retirés à la prochaine tâche horaire." />
          <NumberField label="Fréquence des attaques (×)" hint="1 = une attaque par 48 h et par seigneur agressif ; 0 = aucune." value={cfg.settings.attackFrequency} min={0} step={0.1} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, attackFrequency: v ?? 1 } }))} />
          <NumberField label="Puissance visée (×)" hint="Multiplie la puissance cible de tous les seigneurs." value={cfg.settings.powerFactor} min={0.1} step={0.1} onChange={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, powerFactor: v ?? 1 } }))} />
        </Section>
        <RankRulesSection value={normalizeRankRules(cfg.settings.ranks)} onChange={(r) => setCfg((c) => ({ ...c, settings: { ...c.settings, ranks: r } }))} />
      </Card>
      <OriginsSection cfg={cfg} setCfg={setCfg} />
      {errors.length > 0 && (
        <HudCallout tone="danger" className="text-xs">
          <p className="font-semibold">À corriger avant d'enregistrer :</p>
          <ul className="mt-1 list-inside list-disc">
            {errors.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </HudCallout>
      )}

      {cfg.defs.map((d) => {
        const live = power[d.id];
        const isOpen = open === d.id;
        return (
          <Card key={d.id} className="p-0">
            <button type="button" className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setOpen(isOpen ? null : d.id)}>
              <img src={assetUrl(d.portrait)} alt="" className="h-10 w-10 object-cover object-top" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-100">
                  {d.name} {!d.enabled && <span className="text-xs text-slate-500">(désactivé)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {PERSONALITY_LABELS[d.personality]} · {TIER_LABELS[d.tier]}
                  {live ? ` · puissance ${formatNumber(live.power)}` : ""}
                  {live?.rank ? ` · rang ${RANK_NUMERALS[live.rank - 1]} (menace ${live.threat ?? 0})` : ""}
                  {live && live.absentUntilMs > Date.now() ? " · en fuite" : ""}
                </p>
              </div>
              <ChevronDown className={isOpen ? "h-4 w-4 rotate-180 text-slate-400" : "h-4 w-4 text-slate-400"} />
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-3 border-t border-white/5 p-3 sm:grid-cols-2">
                {live?.history && live.history.length > 0 && <WarlordHistory history={live.history} counter={live.counter} />}
                <TextField label="Nom" value={d.name} onChange={(v) => setDef(d.id, { name: v })} />
                <CheckboxField label="Actif" checked={d.enabled} onChange={(v) => setDef(d.id, { enabled: v })} />
                <SelectField<WarlordPersonality>
                  label="Personnalité"
                  value={d.personality}
                  options={Object.entries(PERSONALITY_LABELS).map(([value, label]) => ({ value: value as WarlordPersonality, label }))}
                  onChange={(v) => setDef(d.id, { personality: v })}
                />
                <SelectField<string>
                  label="Origine"
                  value={d.origin}
                  options={withDefaultOrigins(cfg.origins).map((o) => ({ value: o.id, label: o.label }))}
                  onChange={(v) => setDef(d.id, { origin: v })}
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
                  <Button variant="secondary" size="sm" disabled={busy || !d.enabled} onClick={() => void askConfirm({ title: `Lancer une coalition contre ${d.name} ?`, message: "Elle dure 5 jours.", confirmLabel: "Lancer" }).then((ok) => { if (ok) void run("coalitionStart", d.id); })}>
                    <Handshake className="mr-1 h-3.5 w-3.5" /> Lancer une coalition
                  </Button>
                  <SelectField<string>
                    label="Imposer un rang (tests, réglage)"
                    value={String(live?.rank ?? 1)}
                    options={RANK_NAMES.map((n, i) => ({ value: String(i + 1), label: `${RANK_NUMERALS[i]} · ${n}` }))}
                    onChange={(v) => void run("rank", d.id, { rank: Number(v) })}
                  />
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => void askConfirm({ title: `Recréer ${d.name} de zéro ?`, confirmLabel: "Recréer", tone: "danger" }).then((ok) => { if (ok) void run("reset", d.id); })}>
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

/** 5.23 : courbe de puissance et changements de rang d'un seigneur (relevés de la tâche horaire). */
function WarlordHistory({ history, counter }: { history: WarlordHistoryPoint[]; counter?: WarlordPublic["counter"] }) {
  const max = Math.max(1, ...history.map((h) => h.power));
  const w = 300;
  const h = 48;
  const pts = history.map((p, i) => `${history.length > 1 ? (i / (history.length - 1)) * w : w / 2},${h - (p.power / max) * (h - 4) - 2}`).join(" ");
  const changes = history.filter((p, i) => i === 0 || p.rank !== history[i - 1].rank).slice(-6).reverse();
  const day = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Historique</span>
        {counter && (
          <HudChip size="sm" tone="ember">
            Contre-composition : classe {UNIT_CLASS_LABELS[counter.cls]} jusqu'au {day(counter.untilMs)}
          </HudChip>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none" aria-label="Puissance du seigneur">
        <polyline points={pts} fill="none" stroke="var(--color-cyan-glow)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="font-mono text-[11px] text-slate-500">
        max {formatNumber(max)} · dernier {formatNumber(history[history.length - 1].power)} · {history.length} relevés
      </p>
      <ul className="text-xs text-slate-300">
        {changes.map((c) => (
          <li key={c.atMs}>
            <span className="font-mono text-slate-500">{day(c.atMs)}</span> · rang {RANK_NUMERALS[c.rank - 1]} ({RANK_NAMES[c.rank - 1]}) · <span className="font-mono">{formatNumber(c.power)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
