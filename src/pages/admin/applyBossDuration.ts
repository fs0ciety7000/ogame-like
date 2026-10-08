import { toast } from "sonner";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { isActive, type LeviathanState } from "@/game/leviathan";
import { formatDateTime } from "@/lib/utils";

const HOUR = 3600_000;

/** 5.15 : la durée de présence d'un boss est fixée à son apparition (fin enregistrée
 *  dans le combat). Après un changement de durée, on propose de l'appliquer aussi au
 *  combat en cours : nouvelle fin = début + nouvelle durée. */
export async function offerApplyDuration(opts: {
  state: LeviathanState | null;
  oldHours: number;
  newHours: number;
  name: string;
  reschedule: (endMs: number) => Promise<unknown>;
}): Promise<void> {
  const { state, oldHours, newHours, name } = opts;
  const now = Date.now();
  if (oldHours === newHours || !state || !isActive(state, now)) return;
  const endMs = state.startMs + newHours * HOUR;
  const endLabel = formatDateTime(endMs, "long");
  if (endMs <= now + 5 * 60_000) {
    toast.warning(`${name} : avec ${newHours} h, le combat en cours serait déjà fini. La nouvelle durée vaudra pour le prochain combat ; pour écourter celui-ci, passe par le suivi en direct.`);
    return;
  }
  const ok = await askConfirm({
    title: "Appliquer aussi au combat en cours ?",
    message: `${name} est déjà apparu avec ${oldHours} h de présence. La nouvelle durée (${newHours} h) vaut d'office pour les prochains combats ; ici, la fin du combat en cours passerait au ${endLabel}.`,
    confirmLabel: newHours > oldHours ? "Prolonger" : "Écourter",
    cancelLabel: "Prochains combats seulement",
    tone: "ember",
  });
  if (!ok) return;
  try {
    await opts.reschedule(endMs);
    toast.success(`Fin du combat en cours : ${endLabel}.`);
  } catch (err) {
    toast.error((err as { response?: { message?: string } }).response?.message ?? (err as Error).message);
  }
}
