import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Copy, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { currentGameContent, validateGameContent, type GameContent } from "@/game/content";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";

type ListSection = "buildings" | "units" | "technologies" | "missions" | "factions";
type Item<S extends ListSection> = GameContent[S][number];

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
}: {
  section: S;
  title: string;
  getId: (item: Item<S>) => string;
  getLabel: (item: Item<S>) => string;
  setId: (item: Item<S>, id: string) => Item<S>;
  createItem: () => Item<S>;
  renderForm: (item: Item<S>, onChange: (next: Item<S>) => void, isNew: boolean) => ReactNode;
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

  const visible = draft
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const q = filter.trim().toLowerCase();
      return !q || getLabel(item).toLowerCase().includes(q) || getId(item).toLowerCase().includes(q);
    });

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
    if (!confirm(`Revenir aux ${title.toLowerCase()} par défaut du code ? Les personnalisations seront perdues.`)) return;
    setBusy(true);
    try {
      await resetContentSection(section);
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
        <h2 className="font-display text-base text-white">{title}</h2>
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
          <Button variant="ghost" size="sm" disabled={busy || !customized} onClick={() => void restoreDefaults()}>
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

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <Card className="flex max-h-[70vh] flex-col gap-2 p-2">
          <Input placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8" />
          <div className="flex-1 overflow-y-auto">
            {visible.map(({ item, index }) => (
              <button
                key={`${getId(item)}-${index}`}
                onClick={() => setSelected(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                  index === selected ? "bg-cyan-glow/10 text-cyan-glow" : "text-slate-300 hover:bg-white/5",
                )}
              >
                <span className="truncate">{getLabel(item) || "(sans nom)"}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">{getId(item)}</span>
              </button>
            ))}
          </div>
          <p className="px-1 text-[11px] text-slate-500">{draft.length} élément(s)</p>
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          {current ? (
            <>
              {renderForm(current, update, newIds.has(getId(current)))}
              <div className="flex justify-end border-t border-white/5 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger-glow"
                  onClick={() => {
                    if (!confirm(`Supprimer « ${getLabel(current)} » ? Les joueurs qui en possèdent le conservent en base mais il ne sera plus affiché.`)) return;
                    setDraft((d) => d.filter((_, i) => i !== selected));
                    setSelected((s) => Math.max(0, s - 1));
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer
                </Button>
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
