import { create } from "zustand";
import { pb, subscribeRecords } from "@/lib/pocketbase";
import { CURRENT_VERSION } from "@/lib/changelog";
import { useThemeStore } from "@/lib/theme";
import { unreadStaffReplies, type GameReport, type ReportCategory } from "@/game/reports";

/* Signalements de problèmes (v2.7). Les joueurs ne lisent que les leurs
   (règles d'accès) ; l'administration les voit tous. */

function errorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { message?: string } }).response;
  return data?.message || fallback;
}

function normalize(r: GameReport): GameReport {
  return { ...r, history: r.history ?? [], context: r.context ?? null };
}

export async function fetchReports(filter?: string): Promise<GameReport[]> {
  const list = await pb.collection("reports").getFullList<GameReport>({ sort: "-updatedAtMs", filter });
  return list.map(normalize);
}

/** Liste suivie en direct (les siens pour un joueur, tous pour un admin). */
export function subscribeReports(onChange: (reports: GameReport[]) => void, filter?: string): () => void {
  let active = true;
  const load = () =>
    fetchReports(filter)
      .then((list) => active && onChange(list))
      .catch(() => active && onChange([]));
  load();
  const stop = subscribeRecords("reports", "*", () => load());
  return () => {
    active = false;
    stop();
  };
}

export async function createReport(input: { uid: string; category: ReportCategory; title: string; description: string; screenshot?: File | null }): Promise<GameReport> {
  const form = new FormData();
  form.append("reporterId", input.uid);
  form.append("category", input.category);
  form.append("title", input.title);
  form.append("description", input.description);
  form.append(
    "context",
    JSON.stringify({
      version: CURRENT_VERSION ?? "",
      page: window.location.pathname,
      theme: useThemeStore.getState().theme,
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
    }),
  );
  if (input.screenshot) form.append("screenshot", input.screenshot);
  try {
    return normalize(await pb.collection("reports").create<GameReport>(form));
  } catch (err) {
    throw new Error(errorMessage(err, "Envoi impossible."));
  }
}

export async function commentReport(id: string, text: string): Promise<GameReport> {
  try {
    return normalize(await pb.send<GameReport>("/api/cosmic/reports/comment", { method: "POST", body: { id, text } }));
  } catch (err) {
    throw new Error(errorMessage(err, "Envoi impossible."));
  }
}

export async function markReportSeen(id: string): Promise<void> {
  await pb.send("/api/cosmic/reports/seen", { method: "POST", body: { id } }).catch(() => {});
}

export function reportScreenshotUrl(r: GameReport, thumb = false): string | null {
  if (!r.screenshot) return null;
  return pb.files.getURL(r as unknown as { id: string; collectionId?: string; collectionName?: string }, r.screenshot, thumb ? { thumb: "400x0" } : undefined);
}

/* ---------- administration ---------- */

export async function adminUpdateReport(id: string, update: { status?: string; resolution?: string; comment?: string }): Promise<GameReport> {
  try {
    return normalize(await pb.send<GameReport>("/api/cosmic/admin/reports", { method: "POST", body: { id, ...update } }));
  } catch (err) {
    throw new Error(errorMessage(err, "Mise à jour impossible."));
  }
}

export async function adminReportConfig(): Promise<{ email: boolean; github: boolean }> {
  try {
    return await pb.send("/api/cosmic/admin/reports/config", { method: "GET" });
  } catch {
    return { email: false, github: false };
  }
}

export async function adminCreateGithubIssue(id: string): Promise<GameReport> {
  try {
    return normalize(await pb.send<GameReport>("/api/cosmic/admin/reports/github", { method: "POST", body: { id } }));
  } catch (err) {
    throw new Error(errorMessage(err, "Création de l'issue impossible."));
  }
}

export async function adminDeleteReport(id: string): Promise<void> {
  await pb.collection("reports").delete(id);
}

/* ---------- pastilles de navigation ---------- */

interface ReportBadges {
  /** Réponses de l'équipe non lues (joueur). */
  unread: number;
  /** Signalements « nouveau » (administration). */
  pendingNew: number;
}

export const useReportBadges = create<ReportBadges>(() => ({ unread: 0, pendingNew: 0 }));

export function setMyReportsForBadge(list: GameReport[]) {
  useReportBadges.setState({ unread: list.reduce((n, r) => n + unreadStaffReplies(r), 0) });
}

export function setAllReportsForBadge(list: GameReport[]) {
  useReportBadges.setState({ pendingNew: list.filter((r) => r.status === "new").length });
}
