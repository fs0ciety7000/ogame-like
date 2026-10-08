import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Copy, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currentGameContent, defaultGameContent, validateGameContent, type GameContent } from "@/game/content";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { HudCallout } from "@/components/ui/hud";
import { formatRatio, previewChanges, type RuleChange } from "@/game/adminPreview";

/** 6.14.154 (AU27, R6, AA-28) : avant / après des champs modifiés (fiche ou règles), écarts de plus de ×2 signalés. */
export function ChangesPreview({ changes, title = "Avant / après (non enregistré)" }: { changes: RuleChange[]; title?: string }) {
  const alerts = changes.filter((c) => c.alert).length;
  return (
    <HudCallout tone={alerts > 0 ? "ember" : "neutral"} className="text-xs">
      <details open={changes.length <= 6}>
        <summary className="cursor-pointer">
          {title} : <span className="font-mono tabular-nums">{changes.length}</span> champ{changes.length > 1 ? "s" : ""}
          {alerts > 0 ? (
            <>
              , dont <span className="font-mono tabular-nums">{alerts}</span> à plus de ×2
            </>
          ) : null}
        </summary>
        <ul className="mt-1 flex flex-col gap-0.5 text-slate-300">
          {changes.map((c) => (
            <li key={c.path} className="break-words">
              <span className="text-slate-400">{c.label}</span> : <span className="font-mono text-slate-500 line-through">{c.before}</span> →{" "}
              <span className="font-mono text-gold-glow">{c.after}</span>
              {c.ratio !== null && c.ratio !== 1 && <span className={cn("ml-1 font-mono tabular-nums", c.alert ? "text-ember-glow" : "text-slate-500")}>({formatRatio(c.ratio)})</span>}
            </li>
          ))}
        </ul>
      </details>
    </HudCallout>
  );
}

type ListSection = "buildings" | "units" | "technologies" | "missions" | "factions" | "ranks" | "achievements" | "relics" | "titles" | "talents" | "moduleFamilies" | "moduleTemplates" | "passThemes" | "seasonCatalog" | "allianceChallenges" | "dailyMissionPool" | "chronicleArchetypes";
type Item<S extends ListSection> = GameContent[S][number];

/** 6.14.56 (AU27, AP-1) : succès du code retirés exprès (GameRules.achievementList). Sans cette note, le complément des
 *  succès par défaut (`withDefaultAchievements`) ferait revenir un succès supprimé. */
async function updateRemovedDefaultAchievements(update: (ids: string[]) => string[]) {
  const rules = currentGameContent().rules;
  const raw: unknown = rules.achievementList?.removedDefaults;
  const current = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  const next = update(current);
  if (JSON.stringify(next) === JSON.stringify(current)) return;
  await saveContentSection("rules", { ...rules, achievementList: { ...rules.achievementList, removedDefaults: next } });
}

/** Éditeur d'une liste de définitions (bâtiments, unités…) : liste à
 *  gauche, fiche à droite. Les modifications restent un brouillon local
 *  jusqu'à « Enregistrer », qui valide l'ensemble du contenu du jeu. */
export function ContentEditor<S extends ListSection>({
  section,
  title,
  getId,
  getLabel,
  setId,
  createItem,
  renderForm,
  lockSaved,
}: {
  section: S;
  title: string;
  getId: (item: Item<S>) => string;
  getLabel: (item: Item<S>) => string;
  setId: (item: Item<S>, id: string) => Item<S>;
  createItem: () => Item<S>;
  /** 6.14.154 (AA-28) : `saved` = la même fiche enregistrée (en vigueur), pour l'aperçu avant / après. */
  renderForm: (item: Item<S>, onChange: (next: Item<S>) => void, isNew: boolean, saved?: Item<S>) => ReactNode;
  /** 6.14.127 (AA9, I43) : un élément enregistré ne se supprime pas (le serveur le refuse) ; ce texte remplace « Supprimer ». */
  lockSaved?: string;
}) {
  const customized = useContentStore((s) => s.customized.includes(section));
  const [saved, setSaved] = useState<Item<S>[]>(() => currentGameContent()[section] as Item<S>[]);
  const [draft, setDraft] = useState<Item<S>[]>(saved);
  const [selected, setSelected] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const errors = useMemo(() => validateGameContent({ ...currentGameContent(), [section]: draft }), [draft, section]);
  const current = draft[selected];
  // 6.14.154 (AU27, R6, AA-28) : fiche enregistrée et changements de la fiche ouverte (avant / après, avant d'enregistrer).
  const savedCurrent = current ? saved.find((x) => getId(x) === getId(current)) : undefined;
  const changes = useMemo(() => (current && savedCurrent ? previewChanges(savedCurrent, current, 40) : []), [current, savedCurrent]);

  const visible = draft
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const q = filter.trim().toLowerCase();
      return !q || getLabel(item).toLowerCase().includes(q) || getId(item).toLowerCase().includes(q);
    });

  // v5.14.2 : éléments absents du code (ajoutés depuis l'administration).
  const codeIds = useMemo(() => new Set((defaultGameContent()[section] as Item<S>[]).map(getId)), [section, getId]);
  /** 6.14.127 (AA9) : élément enregistré d'une section sans retrait (talents, modules) : il se retire, il ne se supprime pas. */
  const locked = (item: Item<S> | undefined) => !!lockSaved && !!item && (codeIds.has(getId(item)) || saved.some((x) => getId(x) === getId(item)));
  // « Valeurs par défaut » effacerait les éléments ajoutés et enregistrés (détenus par des joueurs).
  const savedAdded = !!lockSaved && saved.some((x) => !codeIds.has(getId(x)));

  /** Supprime un élément et enregistre aussitôt (refusé si d'autres éléments en dépendent). */
  const remove = async (index: number) => {
    const item = draft[index];
    if (!item) return;
    const fromCode = codeIds.has(getId(item));
    const message = fromCode
      ? "Il fait partie du jeu de base. Les joueurs qui en possèdent le gardent en base, mais il ne sera plus affiché (« Valeurs par défaut » le fait revenir)."
      : "Les joueurs qui en possèdent le gardent en base, mais il ne sera plus affiché.";
    if (!(await askConfirm({ title: `Supprimer « ${getLabel(item)} » ?`, message: message, confirmLabel: "Supprimer", tone: "danger" }))) return;
    const next = draft.filter((_, i) => i !== index);
    const errs = validateGameContent({ ...currentGameContent(), [section]: next });
    if (errs.length > 0) {
      toast.error(`Suppression impossible : ${errs[0]}`, { description: errs.length > 1 ? `${errs.length - 1} autre(s) problème(s).` : undefined });
      return;
    }
    // Jamais enregistré : il suffit de le retirer du brouillon.
    if (!saved.some((x) => getId(x) === getId(item))) {
      setDraft(next);
      setSelected((s) => Math.max(0, Math.min(s >= index ? s - 1 : s, next.length - 1)));
      toast.success(`« ${getLabel(item)} » retiré.`);
      return;
    }
    setBusy(true);
    try {
      // Les autres modifications en cours restent en brouillon : on n'enregistre que la suppression.
      const savedNext = saved.filter((x) => getId(x) !== getId(item));
      if (section === "achievements" && fromCode) await updateRemovedDefaultAchievements((ids) => [...ids.filter((id) => id !== getId(item)), getId(item)]);
      await saveContentSection(section, savedNext as GameContent[S]);
      setSaved(savedNext);
      setDraft(next);
      setSelected((s) => Math.max(0, Math.min(s >= index ? s - 1 : s, next.length - 1)));
      toast.success(`« ${getLabel(item)} » supprimé.`);
    } catch (err) {
      toast.error(`Suppression impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const update = (next: Item<S>) => setDraft((d) => d.map((it, i) => (i === selected ? next : it)));

  const uniqueId = (base: string) => {
    const ids = new Set(draft.map(getId));
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}_${n}`;
    return id;
  };

  const add = (item: Item<S>) => {
    const withId = setId(item, uniqueId(getId(item)));
    setDraft((d) => [...d, withId]);
    setNewIds((s) => new Set(s).add(getId(withId)));
    setSelected(draft.length);
  };

  const save = async () => {
    if (errors.length > 0) {
      toast.error("Corrige les erreurs avant d'enregistrer.");
      return;
    }
    setBusy(true);
    try {
      await saveContentSection(section, draft as GameContent[S]);
      setSaved(draft);
      setNewIds(new Set());
      toast.success(`${title} enregistrés : le jeu utilise désormais ces valeurs.`);
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const restoreDefaults = async () => {
    if (!(await askConfirm({ title: `Revenir aux ${title.toLowerCase()} par défaut ?`, message: "Les personnalisations seront perdues.", confirmLabel: "Rétablir", tone: "danger" }))) return;
    setBusy(true);
    try {
      await resetContentSection(section);
      if (section === "achievements") await updateRemovedDefaultAchievements(() => []);
      const fresh = currentGameContent()[section] as Item<S>[];
      setSaved(fresh);
      setDraft(fresh);
      setSelected(0);
      toast.success("Valeurs par défaut restaurées.");
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-slate-100">{title}</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        {dirty && <Badge variant="alert">Modifications non enregistrées</Badge>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => add(createItem())}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Nouveau
          </Button>
          <Button variant="outline" size="sm" disabled={!current} onClick={() => current && add(structuredClone(current))}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Dupliquer
          </Button>
          <Button variant="outline" size="sm" disabled={!dirty || busy} onClick={() => setDraft(saved)}>
            <Undo2 className="mr-1 h-3.5 w-3.5" /> Annuler
          </Button>
          <Button variant="ghost" size="sm" disabled={busy || !customized || savedAdded} title={savedAdded ? "Des éléments ajoutés sont enregistrés : retire-les plutôt." : undefined} onClick={() => void restoreDefaults()}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={!dirty || busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="border-danger-glow/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-danger-glow">
            <AlertTriangle className="h-3.5 w-3.5" /> {errors.length} problème{errors.length > 1 ? "s" : ""} à corriger
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-300">
            {errors.slice(0, 8).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="flex max-h-[40vh] min-w-0 flex-col gap-2 p-2 lg:max-h-[70vh]">
          <Input placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8" />
          <div className="flex-1 overflow-y-auto">
            {visible.map(({ item, index }) => (
              <div
                key={`${getId(item)}-${index}`}
                className={cn("group flex w-full items-center gap-1 hud-cut-sm pr-1 text-sm transition", index === selected ? "bg-cyan-glow/10 text-cyan-glow" : "text-slate-300 hover:bg-white/5")}
              >
                <button type="button" onClick={() => setSelected(index)} className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-1.5 text-left">
                  <span className="truncate">{getLabel(item) || "(sans nom)"}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {!codeIds.has(getId(item)) && <span className="font-mono text-[9px] uppercase tracking-wider text-gold-glow">ajouté</span>}
                    <span className="font-mono text-[10px] text-slate-500">{getId(item)}</span>
                  </span>
                </button>
                {!locked(item) && (
                  <button type="button" title="Supprimer" aria-label={`Supprimer ${getLabel(item)}`} disabled={busy} onClick={() => void remove(index)} className="shrink-0 p-1 text-slate-600 hover:text-danger-glow">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="px-1 text-[11px] text-slate-500">{draft.length} élément(s)</p>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3 p-4">
          {current ? (
            <>
              {renderForm(current, update, newIds.has(getId(current)), savedCurrent)}
              {changes.length > 0 && <ChangesPreview changes={changes} />}
              <div className="flex justify-end border-t border-white/5 pt-3">
                {locked(current) ? (
                  <p className="min-w-0 text-[11px] text-slate-500">{lockSaved}</p>
                ) : (
                  <Button variant="ghost" size="sm" className="text-danger-glow" disabled={busy} onClick={() => void remove(selected)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Aucun élément.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
