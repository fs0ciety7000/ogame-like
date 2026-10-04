import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Dices, Plus, Radio, RefreshCw, Rocket, Save, Sparkles, Trash2, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent } from "@/game/content";
import { chronicleMonthId } from "@/game/chronicles";
import { COMMANDER_ROLES, COMMANDERS, seasonCommanderDef, type CommanderId } from "@/game/commanders";
import { CHALLENGE_KEYS, hasFullChallenges, nextMonthId, passSeasonAllowed, PASS_FINAL_AMBER, publishPassSeason, upsertPassSeason, validatePassSeasons, type PassSeason } from "@/game/passSeasons";
import { describePassReward, normalizeTierReqs, OBJECTIVE_LABELS, type PassRequirement, type PassReward } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { CATALOG_START, catalogEntryFor, THEME_PRIMARY } from "@/game/seasonCatalog";
import { STORY_SPEAKERS, type Speaker } from "@/game/story";
import { adminPassSeasonChallenges, adminPassSeasonGenerate } from "@/services/adminService";
import { saveContentSection, useContentStore } from "@/services/contentService";
import { RewardEditor } from "@/pages/admin/PassPanel";
import { Field, ImageField, NumberField, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { cn } from "@/lib/utils";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* =====================================================
   v5.13 : passes de saison générés. Le générateur écrit un brouillon par
   mois (thème, scénario, paliers, prérequis, commandant de saison) ; l'équipe
   le relit, le retouche ici, puis le publie. Un brouillon oublié est publié
   d'office au début de son mois.
===================================================== */

const ROLE_OPTIONS = COMMANDER_ROLES.map((r) => ({ value: r, label: COMMANDERS.find((c) => c.id === r)!.title }));
const KEY_OPTIONS = [{ value: "", label: "Aucun prérequis" }, ...Object.entries(OBJECTIVE_LABELS).map(([value, label]) => ({ value, label }))];
const SPEAKER_OPTIONS = (Object.keys(STORY_SPEAKERS) as Speaker[]).map((s) => ({ value: s, label: STORY_SPEAKERS[s].name }));

export function PassSeasonsPanel() {
  const version = useContentStore((s) => s.version);
  const seasons = useMemo(() => currentGameContent().passSeasons.seasons, [version]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<PassSeason | null>(null);
  const [busy, setBusy] = useState(false);

  const current = chronicleMonthId(Date.now());
  const nextToWrite = useMemo(() => {
    // v5.14.1 : pas de passe de saison avant le catalogue (le passe des Chroniques reste en place).
    let id = current < CATALOG_START ? CATALOG_START : current;
    while (seasons.some((s) => s.id === id)) id = nextMonthId(id);
    return id;
  }, [seasons, current]);

  // Sélection par défaut : le prochain brouillon, sinon le passe en cours.
  useEffect(() => {
    if (selected && seasons.some((s) => s.id === selected)) return;
    const pick = seasons.find((s) => s.id === current && s.status === "published") ?? seasons.find((s) => s.status === "draft") ?? seasons[seasons.length - 1];
    setSelected(pick?.id ?? null);
  }, [seasons, selected, current]);

  useEffect(() => {
    const s = seasons.find((x) => x.id === selected);
    setDraft(s ? structuredClone(s) : null);
  }, [selected, seasons]);

  const live = seasons.find((s) => s.id === current && s.status === "published") ?? null;
  const upcoming = seasons.filter((s) => s.id > current || (s.id === current && s.status !== "published"));
  const past = seasons.filter((s) => s.id < current);
  const errors = useMemo(() => (draft ? validatePassSeasons({ seasons: [draft] }) : []), [draft]);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(seasons.find((s) => s.id === draft.id));
  const started = !!draft && draft.id <= current;

  const generate = async (monthId: string, variant: number) => {
    const existing = seasons.find((s) => s.id === monthId);
    if (existing?.status === "published" && !(await askConfirm({ title: `Remplacer le passe ${monthId} ?`, message: `Il est publié${monthId <= current ? " et déjà en cours" : ""} : un nouveau brouillon prend sa place.`, confirmLabel: "Remplacer", tone: "danger" }))) return;
    if (existing && dirty && !(await askConfirm({ title: "Continuer sans enregistrer ?", message: "Tes modifications non enregistrées seront perdues.", confirmLabel: "Continuer", tone: "ember" }))) return;
    setBusy(true);
    try {
      const out = await adminPassSeasonGenerate(monthId, variant, existing?.status === "published");
      // Le contenu se recharge : la sélection suit le mois généré.
      setSelected(monthId);
      setDraft(out.season);
      toast.success(`Brouillon du passe ${monthId} écrit : « ${out.season.theme.name} ».`);
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Génération impossible.");
    } finally {
      setBusy(false);
    }
  };

  // v5.14.2 : nouveaux défis seulement (n'importe quel mois, même en cours).
  const rerollChallenges = async (s: PassSeason) => {
    if (s.status === "published" && s.id <= current && !(await askConfirm({ title: `Réécrire les défis du passe ${seasonLabel(s.id)} ?`, message: "Il est en cours. Thème, récompenses et points ne bougent pas.", confirmLabel: "Réécrire", tone: "ember" }))) return;
    setBusy(true);
    try {
      const out = await adminPassSeasonChallenges(s.id, Date.now() % 1000);
      setDraft(out.season);
      toast.success(`Défis du passe ${seasonLabel(s.id)} réécrits.`);
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Réécriture impossible.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (next: PassSeason, msg: string) => {
    const errs = validatePassSeasons({ seasons: [next] });
    if (errs.length) {
      toast.error(errs[0]);
      return;
    }
    setBusy(true);
    try {
      await saveContentSection("passSeasons", upsertPassSeason(currentGameContent().passSeasons, next));
      setDraft(structuredClone(next));
      toast.success(msg);
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const set = (patch: Partial<PassSeason>) => draft && setDraft({ ...draft, ...patch });

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm text-white">Passes de saison</h2>
        <Button size="sm" variant="outline" className="ml-auto" disabled={busy} onClick={() => void generate(nextToWrite, 0)}>
          <Plus className="h-3.5 w-3.5" /> Écrire le brouillon de {seasonLabel(nextToWrite)}
        </Button>
      </div>

      {/* v5.14.2 : d'abord ce que les joueurs ont sous les yeux, puis le reste. */}
      <div className="hud-cut-sm flex flex-wrap items-center gap-3 border border-mint-glow/40 bg-mint-glow/[0.04] p-3">
        <Radio className="h-4 w-4 text-mint-glow" />
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px] text-mint-glow">Passe actif · {seasonLabel(current)}</p>
          {live ? (
            <p className="text-sm text-white">
              « {live.theme.name} » <span className="text-xs text-slate-400">· passe de saison publié · {hasFullChallenges(live) ? "un défi par palier" : "défis incomplets"}</span>
            </p>
          ) : (
            <p className="text-sm text-white">
              Passe par défaut <span className="text-xs text-slate-400">· aucun passe de saison publié ce mois-ci : c'est le passe du bloc « Passe par défaut » (plus bas) qui s'applique.</span>
            </p>
          )}
        </div>
        {live && (
          <Button size="sm" variant={selected === live.id ? "secondary" : "outline"} onClick={() => setSelected(live.id)}>
            Ouvrir
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        À partir de {seasonLabel(CATALOG_START)}, le générateur écrit chaque mois un brouillon : thème du catalogue, scénario en quatre temps, 30 paliers avec chacun son défi, et au dernier palier un commandant de saison inédit avec {PASS_FINAL_AMBER} Ambre. Relis, retouche, puis publie avant le 1er : un brouillon non publié est publié d'office le 1er du mois.
      </p>

      <CatalogOverview current={current} />

      {([
        ["À venir", upcoming, "Brouillons et passes publiés des mois suivants."],
        ["Terminés", past, "Mois passés : en lecture, pour mémoire."],
      ] as const).map(([label, list, hint]) =>
        list.length === 0 ? null : (
          <div key={label} className="flex flex-col gap-1.5">
            <p className="hud-eyebrow text-[10px] text-slate-400">
              {label} <span className="normal-case tracking-normal text-slate-500">· {hint}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((s) => (
                <HudChip key={s.id} asChild size="md" tone={s.id === selected ? "accent" : s.status === "published" ? "mint" : "ember"}>
                  <button type="button" className="hud-chip-action" onClick={() => setSelected(s.id)}>
                    {seasonLabel(s.id)} · {s.status === "published" ? "publié" : "brouillon"}
                  </button>
                </HudChip>
              ))}
            </div>
          </div>
        ),
      )}
      {seasons.length === 0 && <p className="text-sm text-slate-500">Aucun passe de saison pour l'instant.</p>}

      {draft && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <span className="h-3 w-3 shrink-0" style={{ background: draft.theme.accent }} />
            <h3 className="hud-title text-base text-white">
              {seasonLabel(draft.id)} · {draft.theme.name}
            </h3>
            <HudChip size="sm" tone={draft.id === live?.id ? "mint" : draft.id < current ? "neutral" : draft.status === "published" ? "accent" : "ember"} alert={draft.status === "draft"}>
              {draft.id === live?.id ? "Actif : les joueurs l'utilisent" : draft.id < current ? "Terminé" : draft.status === "published" ? `Publié · démarre en ${seasonLabel(draft.id).toLowerCase()}` : "Brouillon"}
            </HudChip>
            {dirty && <HudChip size="sm" tone="gold">Modifié</HudChip>}
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" disabled={busy || draft.id < current} onClick={() => void rerollChallenges(draft)} title="Nouveaux défis seulement : thème, récompenses et points par palier ne bougent pas (possible sur le passe actif)">
                <Dices className="h-3.5 w-3.5" /> Nouveaux défis
              </Button>
              {draft.id > current && passSeasonAllowed(draft.id) && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void generate(draft.id, (draft.auto?.variant ?? 0) + 1)} title="Nouveau tirage complet : paliers, défis et répliques (thème et commandant suivent le catalogue)">
                  <RefreshCw className="h-3.5 w-3.5" /> Tout régénérer
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={busy || !dirty || errors.length > 0} onClick={() => void save(draft, "Passe enregistré.")}>
                <Save className="h-3.5 w-3.5" /> Enregistrer
              </Button>
              {draft.status === "draft" ? (
                <Button size="sm" disabled={busy || errors.length > 0} onClick={() => void save(publishPassSeason(draft, Date.now()), `Passe ${seasonLabel(draft.id)} publié.`)}>
                  <Rocket className="h-3.5 w-3.5" /> Publier
                </Button>
              ) : (
                !started && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void save({ ...draft, status: "draft", publishedAtMs: undefined }, "Repassé en brouillon.")}>
                    <Undo2 className="h-3.5 w-3.5" /> Dépublier
                  </Button>
                )
              )}
            </div>
          </div>
          {started && draft.status === "published" && (
            <HudCallout tone="ember" className="text-xs">
              Ce passe est en cours : les joueurs l'utilisent. Retouche avec prudence (un palier supprimé ou décalé change ce qu'ils peuvent réclamer).
            </HudCallout>
          )}
          {errors.length > 0 && (
            <HudCallout tone="danger" className="text-xs">
              {errors.join(" ")}
            </HudCallout>
          )}

          {/* Thème */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Nom du passe" value={draft.theme.name} onChange={(name) => set({ theme: { ...draft.theme, name } })} />
            <TextField label="Accroche" value={draft.theme.tagline} onChange={(tagline) => set({ theme: { ...draft.theme, tagline } })} />
            <Field label="Couleur d'accent">
              <div className="flex items-center gap-2">
                <input type="color" value={draft.theme.accent} onChange={(e) => set({ theme: { ...draft.theme, accent: e.target.value } })} className="h-10 w-14 border border-white/15 bg-transparent" />
                <span className="font-mono text-xs text-slate-400">{draft.theme.accent}</span>
              </div>
            </Field>
            <NumberField label="Points par palier" value={draft.pointsPerTier} min={1} onChange={(v) => set({ pointsPerTier: Math.max(1, v ?? 1) })} />
            <ImageField label="Illustration (en-tête de la page du passe)" value={draft.theme.image} onChange={(image) => set({ theme: { ...draft.theme, image } })} />
            {draft.theme.prompt && (
              <div className="sm:col-span-2">
                <PromptBox prompt={draft.theme.prompt} title="Copier le prompt Midjourney de l'illustration" />
              </div>
            )}
          </section>

          {/* Scénario */}
          <section className="flex flex-col gap-2">
            <p className="hud-eyebrow text-[10px] text-slate-400">Scénario</p>
            <TextAreaField label="Synopsis" rows={2} value={draft.scenario.synopsis} onChange={(synopsis) => set({ scenario: { ...draft.scenario, synopsis } })} />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {draft.scenario.milestones.map((m, i) => (
                <div key={i} className="hud-cut-sm flex flex-col gap-2 border border-white/10 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                    <TextField label="Titre" value={m.title} onChange={(title) => set({ scenario: { ...draft.scenario, milestones: draft.scenario.milestones.map((x, j) => (j === i ? { ...x, title } : x)) } })} />
                    <NumberField label="Palier" value={m.tier} min={0} onChange={(v) => set({ scenario: { ...draft.scenario, milestones: draft.scenario.milestones.map((x, j) => (j === i ? { ...x, tier: Math.max(0, Math.min(draft.tiers.length, v ?? 0)) } : x)) } })} />
                  </div>
                  {m.lines.map((l, k) => (
                    <div key={k} className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <SelectField<Speaker> label="Voix" value={l.speaker} options={SPEAKER_OPTIONS} onChange={(speaker) => set({ scenario: { ...draft.scenario, milestones: draft.scenario.milestones.map((x, j) => (j === i ? { ...x, lines: x.lines.map((y, n) => (n === k ? { ...y, speaker } : y)) } : x)) } })} />
                      <TextField label="Réplique" value={l.text} onChange={(text) => set({ scenario: { ...draft.scenario, milestones: draft.scenario.milestones.map((x, j) => (j === i ? { ...x, lines: x.lines.map((y, n) => (n === k ? { ...y, text } : y)) } : x)) } })} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Commandant de saison */}
          <CommanderEditor draft={draft} set={set} />

          {/* Paliers */}
          <section className="flex flex-col gap-2">
            <p className="hud-eyebrow text-[10px] text-slate-400">Paliers et prérequis</p>
            {/* v5.14.1 : un prérequis par palier au tirage ; on signale ceux qui n'en ont pas (retouche manuelle). */}
            {(() => {
              const without = draft.tiers.map((_, i) => i + 1).filter((t) => normalizeTierReqs(draft.requirements[String(t)]).length === 0);
              return (
                <p className="text-xs text-slate-400">
                  {without.length === 0 ? `Chaque palier a son défi (${draft.tiers.length} sur ${draft.tiers.length}).` : `Paliers sans défi : ${without.join(", ")}. « Nouveaux défis » en donne un à chaque palier.`}
                </p>
              );
            })()}
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {draft.tiers.map((rewards, i) => (
                <TierRow key={i} tier={i + 1} rewards={rewards} season={draft} onChange={(next) => set(next)} />
              ))}
            </div>
          </section>

          {draft.auto && (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer text-slate-300">Pourquoi ces choix ? (variante {draft.auto.variant})</summary>
              <ul className="mt-2 list-disc space-y-0.5 pl-5">
                {draft.auto.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}

function CommanderEditor({ draft, set }: { draft: PassSeason; set: (patch: Partial<PassSeason>) => void }) {
  const c = draft.commander;
  const setC = (patch: Partial<PassSeason["commander"]>) => set({ commander: { ...c, ...patch } });
  const def = seasonCommanderDef(c);
  return (
    <section className="flex flex-col gap-2">
      <p className="hud-eyebrow text-[10px] text-gold-glow">Commandant de saison (dernier palier)</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Nom" value={c.name} onChange={(name) => setC({ name })} />
        <TextField label="Titre" value={c.title} onChange={(title) => setC({ title })} />
        <SelectField<CommanderId> label="Rôle principal" value={c.primary} options={ROLE_OPTIONS} onChange={(primary) => setC({ primary })} />
        <SelectField<CommanderId> label="Second rôle (moitié du bonus)" value={c.secondary} options={ROLE_OPTIONS} onChange={(secondary) => setC({ secondary })} />
        <ImageField label="Portrait (vide : portrait du rôle principal)" value={c.portrait} onChange={(portrait) => setC({ portrait })} />
        <TextAreaField label="Histoire" rows={2} value={c.lore} onChange={(lore) => setC({ lore })} />
      </div>
      <p className="text-xs text-slate-300">
        Bonus au niveau 10 : <span className="text-slate-100">{def.bonus(10)}</span>. Progresse comme {COMMANDERS.find((x) => x.id === c.primary)?.title.toLowerCase()}.
      </p>
      <PromptBox prompt={c.prompt} title="Copier le prompt Midjourney du portrait" />
    </section>
  );
}

/** Prompt Midjourney à copier (portrait, illustration). */
function PromptBox({ prompt, title }: { prompt: string; title: string }) {
  return (
    <div className="hud-cut-sm flex items-start gap-2 border border-white/10 bg-white/[0.02] p-2">
      <p className="min-w-0 flex-1 break-words font-mono text-[11px] text-slate-400">{prompt}</p>
      <Button
        size="icon"
        variant="ghost"
        title={title}
        onClick={() => {
          void navigator.clipboard?.writeText(prompt);
          toast.success("Prompt copié.");
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/** v5.14 : les 36 saisons du catalogue (douze thèmes en rotation, trois ans). */
function CatalogOverview({ current }: { current: string }) {
  const months = useMemo(() => {
    const out: string[] = [];
    let m = CATALOG_START;
    for (let i = 0; i < 36; i++) {
      out.push(m);
      m = nextMonthId(m);
    }
    return out;
  }, []);
  const role = (r: CommanderId) => COMMANDERS.find((c) => c.id === r)?.title ?? r;
  return (
    <details className="hud-cut-sm border border-white/10 p-3">
      <summary className="cursor-pointer text-xs text-slate-300">Catalogue des 36 saisons (douze thèmes, trois ans, un commandant aux effets uniques par saison)</summary>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {months.map((m, i) => {
          const e = catalogEntryFor(m);
          return (
            <div key={m} className={cn("flex flex-col gap-0.5 border-l-2 py-1 pl-2", m === current ? "border-cyan-glow" : "border-white/10")}>
              <p className="font-mono text-[10px] text-slate-500">
                {i + 1} / 36 · {seasonLabel(m)} · année {e.year}
              </p>
              <p className="text-sm text-white">{e.name}</p>
              <p className="text-xs text-slate-400">
                {e.commander.name}, {e.commander.title.toLowerCase()} · {role(THEME_PRIMARY[e.theme])} + {role(e.commander.secondary).toLowerCase()}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function TierRow({ tier, rewards, season, onChange }: { tier: number; rewards: PassReward[]; season: PassSeason; onChange: (patch: Partial<PassSeason>) => void }) {
  // v5.14.1 : un défi par palier, d'un à quatre prérequis (l'ancien format n'en avait qu'un).
  const reqs = normalizeTierReqs(season.requirements[String(tier)]);
  const setRewards = (list: PassReward[]) => onChange({ tiers: season.tiers.map((t, j) => (j === tier - 1 ? list : t)) });
  const setReqs = (list: PassRequirement[]) => {
    const r = { ...season.requirements };
    if (list.length > 0) r[String(tier)] = list;
    else delete r[String(tier)];
    onChange({ requirements: r });
  };
  const freeKey = CHALLENGE_KEYS.find((k) => !reqs.some((r) => r.key === k));
  return (
    <div className={cn("hud-cut-sm flex flex-col gap-1.5 border p-2", tier % 10 === 0 ? "border-gold-glow/40" : "border-white/10")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("w-16 font-mono text-xs", tier % 10 === 0 ? "text-gold-glow" : "text-slate-400")}>Palier {tier}</span>
        {reqs.length === 0 && <span className="text-xs text-slate-500">Aucun prérequis</span>}
        {reqs.length < 4 && freeKey && (
          <Button size="sm" variant="ghost" onClick={() => setReqs([...reqs, { key: freeKey, count: 1 }])} title="Ajouter un prérequis">
            <Plus className="h-3.5 w-3.5" /> Prérequis
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setRewards([...rewards, { kind: "amber", amount: 20 }])}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {reqs.map((r, i) => (
        <div key={r.key} className="flex flex-wrap items-center gap-2 pl-2">
          <select
            value={r.key}
            onChange={(e) => setReqs(reqs.map((x, j) => (j === i ? { ...x, key: e.target.value as PassRequirement["key"] } : x)))}
            className="h-8 min-w-0 flex-1 border border-white/15 bg-space-950 px-1.5 text-xs text-slate-200"
            aria-label="Action du défi"
          >
            {KEY_OPTIONS.filter((o) => o.value && (o.value === r.key || !reqs.some((x) => x.key === o.value))).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input type="number" min={1} value={r.count} onChange={(e) => setReqs(reqs.map((x, j) => (j === i ? { ...x, count: Math.max(1, Number(e.target.value) || 1) } : x)))} className="h-8 w-16 border border-white/15 bg-space-950 px-1.5 font-mono text-xs text-slate-200" aria-label="Nombre" />
          <Button size="icon" variant="ghost" onClick={() => setReqs(reqs.filter((_, j) => j !== i))} title="Retirer ce prérequis">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-1">
        {rewards.map((r, k) =>
          r.kind === "commander" ? (
            <HudChip key={k} size="sm" tone="gold" className="normal-case tracking-normal">
              {describePassReward(r)}
            </HudChip>
          ) : (
            <RewardEditor key={k} value={r} onChange={(nr) => setRewards(rewards.map((x, j) => (j === k ? nr : x)))} onRemove={() => setRewards(rewards.filter((_, j) => j !== k))} />
          ),
        )}
      </div>
    </div>
  );
}
