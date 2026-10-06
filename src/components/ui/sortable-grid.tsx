import { useMemo, type ReactNode } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, Check, GripVertical, LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyOrder, moveCard, resetCardOrder, setCardOrder, useCardOrders } from "@/lib/cardOrder";
import { cn } from "@/lib/utils";

/* 5.24 : grille de cartes réorganisable par glisser-déposer (souris, tactile
   après un appui long, clavier) ou par flèches. Hors édition, la grille se
   rend normalement, dans l'ordre choisi par le joueur. */

/** Ordre affiché d'une page : utile si la page veut trier avant de rendre. */
export function useOrderedItems<T>(page: string, items: T[], getId: (item: T) => string): T[] {
  const saved = useCardOrders((s) => s.orders[page]);
  return useMemo(() => {
    const byId = new Map(items.map((it) => [getId(it), it]));
    return applyOrder([...byId.keys()], saved).map((id) => byId.get(id)!);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getId est une fonction d'accès stable
  }, [items, saved]);
}

export function SortableGrid<T>({
  page,
  items,
  getId,
  getLabel,
  render,
  editing,
  className,
}: {
  page: string;
  items: T[];
  getId: (item: T) => string;
  /** Nom affiché dans la barre de déplacement. */
  getLabel?: (item: T) => string;
  render: (item: T, index: number) => ReactNode;
  editing: boolean;
  className?: string;
}) {
  const saved = useCardOrders((s) => s.orders[page]);
  const ordered = useOrderedItems(page, items, getId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const visible = ordered.map(getId);
  // Ordre complet : l'ordre enregistré (y compris les cartes filtrées), puis les nouvelles.
  const full = applyOrder([...(saved ?? []), ...visible.filter((id) => !(saved ?? []).includes(id))], saved);
  const move = (active: string, over: string) => setCardOrder(page, moveCard(full, visible, active, over));

  if (!editing) return <div className={className}>{ordered.map((it, i) => render(it, i))}</div>;

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) move(String(e.active.id), String(e.over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={visible} strategy={rectSortingStrategy}>
        <div className={className}>
          {ordered.map((it, i) => (
            <SortableCard
              key={visible[i]}
              id={visible[i]}
              label={getLabel?.(it) ?? visible[i]}
              onPrev={i > 0 ? () => move(visible[i], visible[i - 1]) : undefined}
              onNext={i < visible.length - 1 ? () => move(visible[i], visible[i + 1]) : undefined}
            >
              {render(it, i)}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCard({ id, label, onPrev, onNext, children }: { id: string; label: string; onPrev?: () => void; onNext?: () => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative flex flex-col border border-dashed border-cyan-glow/40 bg-space-900/60", isDragging && "z-20 border-solid border-cyan-glow/80 opacity-90")}
    >
      <div className="flex items-center gap-1.5 border-b border-cyan-glow/15 px-2 py-1.5">
        <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} title="Glisser pour déplacer" className="cursor-grab touch-none p-1 text-cyan-glow active:cursor-grabbing">
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <span className="min-w-0 flex-1 truncate font-display text-xs font-semibold uppercase tracking-[0.1em] text-slate-200">{label}</span>
        <button type="button" title="Avancer" aria-label={`Avancer ${label}`} disabled={!onPrev} onClick={onPrev} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button type="button" title="Reculer" aria-label={`Reculer ${label}`} disabled={!onNext} onClick={onNext} className="p-1 text-slate-400 hover:text-cyan-glow disabled:opacity-30">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {/* Carte inerte pendant l'édition : elle se déplace d'un bloc. */}
      <div className="pointer-events-none flex-1 opacity-75">{children}</div>
    </div>
  );
}

/** Bouton « Réorganiser / Terminer » + « Ordre par défaut » quand un ordre est enregistré. */
export function SortableGridToggle({ page, editing, onToggle }: { page: string; editing: boolean; onToggle: () => void }) {
  const custom = useCardOrders((s) => (s.orders[page]?.length ?? 0) > 0);
  return (
    <div className="flex items-center gap-1.5">
      {editing && custom && (
        <Button variant="ghost" size="sm" onClick={() => resetCardOrder(page)}>
          <RotateCcw className="h-3.5 w-3.5" /> Ordre par défaut
        </Button>
      )}
      <Button variant={editing ? "primary" : "ghost"} size="sm" onClick={onToggle} aria-pressed={editing}>
        {editing ? <Check className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
        {editing ? "Terminer" : "Réorganiser"}
      </Button>
    </div>
  );
}
