import { useEffect, useMemo, useRef, useState } from "react";
import { CloudDownload, Download, RefreshCw, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { currentGameContent, validateGameContent, type GameContent, type GameRules } from "@/game/content";
import { RESOURCE_LIST } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import {
  adminClearQueues,
  adminListPlayers,
  adminResetAllXp,
  adminUpdateHooks,
  adminUpdatePlayer,
  type AdminPlayer,
} from "@/services/adminService";
import { NumberField, Section } from "@/pages/admin/fields";

const HOUR = 3600 * 1000;
const MIN = 60 * 1000;

/* ---------------- Règles ---------------- */

export function RulesPanel() {
  const customized = useContentStore((s) => s.customized.includes("rules"));
  const [rules, setRules] = useState<GameRules>(() => currentGameContent().rules);
  const [busy, setBusy] = useState(false);
  const pvp = rules.pvp;
  const setPvp = (patch: Partial<GameRules["pvp"]>) => setRules((r) => ({ ...r, pvp: { ...r.pvp, ...patch } }));

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("rules", rules);
      toast.success("Règles enregistrées (appliquées aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Règles de combat</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("rules");
              setRules(currentGameContent().rules);
              toast.success("Règles par défaut restaurées.");
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
        <Section title="Protections">
          <NumberField label="Délai entre 2 attaques sur une même cible (h)" value={pvp.attackCooldownMs / HOUR} min={0} step={0.25} onChange={(v) => setPvp({ attackCooldownMs: (v ?? 0) * HOUR })} />
          <NumberField label="Bouclier après une défaite (min)" value={pvp.shieldAfterDefeatMs / MIN} min={0} step={5} onChange={(v) => setPvp({ shieldAfterDefeatMs: (v ?? 0) * MIN })} />
          <NumberField label="Protection débutant (h)" value={pvp.newbieProtectionMs / HOUR} min={0} step={1} onChange={(v) => setPvp({ newbieProtectionMs: (v ?? 0) * HOUR })} hint="Levée dès que le joueur attaque." />
          <NumberField label="Écart d'XP maximal (×)" value={pvp.maxXpRatio} min={1} step={0.5} onChange={(v) => setPvp({ maxXpRatio: v ?? 1 })} hint="Cible interdite si son XP × cette valeur < ton XP." />
          <NumberField label="…à partir de (XP de l'attaquant)" value={pvp.xpGapFloor} min={0} step={50} onChange={(v) => setPvp({ xpGapFloor: v ?? 0 })} />
        </Section>
        <Section title="XP et butin">
          <NumberField label="Perte d'XP max en défense / 24 h" value={pvp.defenseXpLossCapPer24h} min={0} step={5} onChange={(v) => setPvp({ defenseXpLossCapPer24h: v ?? 0 })} />
          <NumberField
            label="Butin : ressources communes (0,10 = 10 %)"
            value={rules.combat.lootPercentCommon}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, lootPercentCommon: v ?? 0 } }))}
          />
          <NumberField
            label="Butin : ressources rares (0,08 = 8 %)"
            value={rules.combat.lootPercent}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, combat: { ...r.combat, lootPercent: v ?? 0 } }))}
            hint="Limité par la cargaison (stat CAP) des vaisseaux survivants."
          />
        </Section>
        <Section title="Économie">
          <NumberField
            label="Entretien : énergie/s par place de hangar (attaque)"
            value={rules.economy.upkeepPerPlaceAttack}
            min={0}
            step={0.001}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, upkeepPerPlaceAttack: v ?? 0 } }))}
          />
          <NumberField
            label="Entretien : énergie/s par place (défense)"
            value={rules.economy.upkeepPerPlaceDefense}
            min={0}
            step={0.001}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, upkeepPerPlaceDefense: v ?? 0 } }))}
          />
          <NumberField
            label="Production pendant une panne d'énergie (0,5 = 50 %)"
            value={rules.economy.outageProductionFactor}
            min={0}
            step={0.05}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, outageProductionFactor: v ?? 0 } }))}
          />
          <NumberField
            label="Part de l'entrepôt à l'abri du pillage (0,1 = 10 %)"
            value={rules.economy.protectedStoragePct}
            min={0}
            step={0.01}
            onChange={(v) => setRules((r) => ({ ...r, economy: { ...r.economy, protectedStoragePct: v ?? 0 } }))}
          />
        </Section>
      </Card>
    </div>
  );
}

/* ---------------- Joueurs ---------------- */

export function PlayersPanel() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPlayer | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const content = useMemo(() => currentGameContent(), []);

  const reload = async () => {
    try {
      setPlayers(await adminListPlayers());
    } catch (err) {
      toast.error(`Lecture des joueurs impossible : ${(err as Error).message}`);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  useEffect(() => {
    const p = players.find((x) => x.id === selectedId);
    setDraft(p ? structuredClone(p) : null);
  }, [selectedId, players]);

  const filtered = players.filter((p) => !search || p.pseudo?.toLowerCase().includes(search.toLowerCase()));
  const set = (patch: Partial<AdminPlayer>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await adminUpdatePlayer(draft.id, {
        xp: draft.xp,
        seasonXp: draft.seasonXp,
        resources: draft.resources,
        buildings: draft.buildings,
        units: draft.units,
        techLevels: draft.techLevels,
      });
      toast.success(`${draft.pseudo} mis à jour.`);
      await reload();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <Card className="flex max-h-[75vh] flex-col gap-2 p-2">
        <div className="flex gap-2">
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8" />
          <Button variant="ghost" size="icon" title="Recharger" onClick={() => void reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                p.id === selectedId ? "bg-cyan-glow/10 text-cyan-glow" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="truncate">{p.pseudo}</span>
              <span className="tabular-mono text-[11px] text-slate-500">{formatNumber(p.xp ?? 0)} XP</span>
            </button>
          ))}
        </div>
        <p className="px-1 text-[11px] text-slate-500">{players.length} joueur(s)</p>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        {!draft ? (
          <p className="text-sm text-slate-500">Sélectionne un joueur.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base text-white">{draft.pseudo}</h2>
              <span className="font-mono text-[11px] text-slate-500">{draft.id}</span>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("Vider toutes les files (constructions, unités, recherches, missions) de ce joueur ?")) return;
                    await adminClearQueues(draft.id);
                    toast.success("Files vidées.");
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Vider les files
                </Button>
                <Button size="sm" disabled={busy} onClick={() => void save()}>
                  <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
                </Button>
              </div>
            </div>

            <Section title="Expérience">
              <NumberField label="XP totale" value={draft.xp} min={0} step={1} onChange={(v) => set({ xp: v ?? 0 })} />
              <NumberField label="XP de la saison" value={draft.seasonXp} min={0} step={1} onChange={(v) => set({ seasonXp: v ?? 0 })} />
            </Section>

            <Section title="Ressources">
              {RESOURCE_LIST.map((r) => (
                <NumberField
                  key={r.id}
                  label={`${r.emoji} ${r.name}`}
                  value={Math.floor(draft.resources?.[r.id] ?? 0)}
                  min={0}
                  step={1}
                  onChange={(v) => set({ resources: { ...draft.resources, [r.id]: v ?? 0 } })}
                />
              ))}
            </Section>

            <Section title="Bâtiments (niveau, débloqué)">
              {content.buildings.map((b) => {
                const st = draft.buildings?.[b.id] ?? { level: 1, unlocked: false };
                return (
                  <div key={b.id} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="flex-1 truncate">{b.name}</span>
                    <Input
                      type="number"
                      min={0}
                      max={b.maxLevel}
                      value={st.level}
                      className="h-8 w-20"
                      onChange={(e) => set({ buildings: { ...draft.buildings, [b.id]: { ...st, level: Number(e.target.value) || 0 } } })}
                    />
                    <input
                      type="checkbox"
                      checked={st.unlocked}
                      title="Débloqué"
                      className="accent-cyan-400"
                      onChange={(e) => set({ buildings: { ...draft.buildings, [b.id]: { ...st, unlocked: e.target.checked } } })}
                    />
                  </div>
                );
              })}
            </Section>

            <Section title="Unités (niveau, quantité)">
              {content.units.map((u) => {
                const st = draft.units?.[u.id] ?? { level: 0, count: 0 };
                const setUnit = (patch: Partial<typeof st>) => set({ units: { ...draft.units, [u.id]: { ...st, ...patch } } });
                return (
                  <div key={u.id} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="flex-1 truncate">{u.name}</span>
                    <Input type="number" min={0} value={st.level} className="h-8 w-16" onChange={(e) => setUnit({ level: Number(e.target.value) || 0 })} />
                    <Input type="number" min={0} value={st.count} className="h-8 w-24" onChange={(e) => setUnit({ count: Number(e.target.value) || 0 })} />
                  </div>
                );
              })}
            </Section>

            <Section title="Technologies (niveau)">
              {content.technologies.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="flex-1 truncate">{t.nom}</span>
                  <Input
                    type="number"
                    min={0}
                    max={t.maxLevel}
                    value={draft.techLevels?.[t.id] ?? 0}
                    className="h-8 w-20"
                    onChange={(e) => set({ techLevels: { ...draft.techLevels, [t.id]: Number(e.target.value) || 0 } })}
                  />
                </div>
              ))}
            </Section>
            <p className="text-[11px] text-slate-500">
              Les bonus de technos (production, attaque…) se recalculent au prochain achèvement de recherche du joueur ; les
              niveaux d'unités sont pris en compte immédiatement.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Outils ---------------- */

export function ToolsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [updatingHooks, setUpdatingHooks] = useState(false);

  const updateHooks = async () => {
    setUpdatingHooks(true);
    try {
      const report = await adminUpdateHooks();
      if (report.errors.length > 0) toast.error(`Mise à jour annulée : ${report.errors.join(" · ")}`);
      else if (report.updated.length > 0) toast.success(`Hooks mis à jour (${report.updated.join(", ")}). Le serveur redémarre.`);
      else toast.success(`Les hooks sont déjà à jour (${report.branch}).`);
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setUpdatingHooks(false);
    }
  };

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(currentGameContent(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cosmic-empires-contenu-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importContent = async (file: File) => {
    let data: GameContent;
    try {
      data = { ...currentGameContent(), ...JSON.parse(await file.text()) };
    } catch {
      toast.error("Fichier JSON illisible.");
      return;
    }
    const errors = validateGameContent(data);
    if (errors.length > 0) {
      toast.error(`Import refusé : ${errors.slice(0, 3).join(" · ")}`);
      return;
    }
    if (!confirm("Remplacer tout le contenu du jeu par ce fichier ?")) return;
    for (const section of ["buildings", "units", "technologies", "missions", "rules"] as const) {
      await saveContentSection(section, data[section] as never);
    }
    toast.success("Contenu importé.");
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-sm text-white">Sauvegarde du contenu</h3>
        <p className="text-xs text-slate-400">
          Exporte bâtiments, unités, technos, missions et règles en JSON (à garder avant de gros changements), ou réimporte
          un fichier exporté.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportContent}>
            <Download className="mr-1 h-3.5 w-3.5" /> Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Importer
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void importContent(f);
            }}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-sm text-white">Code du serveur</h3>
        <p className="text-xs text-slate-400">
          Le serveur récupère ses hooks (règles du jeu côté serveur) depuis la branche main du dépôt à chaque démarrage. Ce
          bouton le fait tout de suite, par exemple juste après un déploiement.
        </p>
        <Button variant="outline" size="sm" className="self-start" disabled={updatingHooks} onClick={() => void updateHooks()}>
          <CloudDownload className="mr-1 h-3.5 w-3.5" /> {updatingHooks ? "Mise à jour…" : "Mettre à jour les hooks"}
        </Button>
      </Card>

      <Card className="flex flex-col gap-2 border-danger-glow/30 p-4">
        <h3 className="font-display text-sm text-danger-glow">Remise à zéro de l'XP</h3>
        <p className="text-xs text-slate-400">
          Remet l'XP totale et de saison de tous les joueurs à 0 (ressources, bâtiments et unités conservés). Irréversible.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          disabled={progress !== null}
          onClick={async () => {
            if (prompt("Tape RESET pour confirmer la remise à zéro de l'XP de tous les joueurs.") !== "RESET") return;
            try {
              const n = await adminResetAllXp((done, total) => setProgress(`${done} / ${total}`));
              toast.success(`XP remise à zéro pour ${n} joueurs.`);
            } catch (err) {
              toast.error(`Interrompu : ${(err as Error).message}`);
            } finally {
              setProgress(null);
            }
          }}
        >
          {progress ? `En cours… ${progress}` : "Remettre toute l'XP à zéro"}
        </Button>
      </Card>
    </div>
  );
}
