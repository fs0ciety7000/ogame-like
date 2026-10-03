import type { ResetOptions } from "@/game/reset";
import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuthStore } from "@/store/authStore";
import type { PlayerState, QueuesState } from "@/types/game";
import type { GameStats } from "@/game/analytics";
import type { StaffRole } from "@/game/staff";

/* =====================================================
   Administration du jeu.

   Un administrateur est un compte dont l'id figure dans la collection
   `admins` (modifiable uniquement par un superuser PocketBase : admin
   PocketBase → collection admins → New record, id = id du compte, ou
   ADMIN_EMAILS dans pocketbase/setup.mjs). Les règles d'accès
   (pocketbase/pb_schema.json) donnent à ces comptes l'écriture sur
   game_config, game_assets et les profils joueurs.
===================================================== */

export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    await pb.collection("admins").getOne(uid, { fields: "id" });
    return true;
  } catch {
    return false;
  }
}

/** true si le joueur connecté est administrateur (false pendant la vérification). */
export function useIsAdmin(): boolean {
  const uid = useAuthStore((s) => s.user?.uid);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    checkIsAdmin(uid).then((v) => active && setIsAdmin(v));
    return () => {
      active = false;
    };
  }, [uid]);
  return isAdmin;
}

export type AdminPlayer = PlayerState & { id: string };

export async function adminListPlayers(): Promise<AdminPlayer[]> {
  const records = await pb.collection("players").getFullList<AdminPlayer>({ sort: "-xp" });
  return records.map((r) => ({ ...r, uid: r.id }));
}

/** Modifie un profil joueur (ressources, niveaux, XP…). */
export async function adminUpdatePlayer(id: string, patch: Partial<PlayerState>, reason = "") {
  const data: Partial<PlayerState> & { adminReason?: string } = { ...patch, adminReason: reason };
  delete data.uid;
  await pb.collection("players").update(id, data);
}

export async function adminGetQueues(id: string): Promise<QueuesState | null> {
  try {
    return await pb.collection("queues").getOne<QueuesState>(id);
  } catch {
    return null;
  }
}

/** Vide les files d'attente d'un joueur (déblocage d'un état incohérent). */
export async function adminClearQueues(id: string) {
  await pb.collection("queues").update(id, {
    buildingUpgrades: {},
    unitQueues: { attack: [], defense: [] },
    activeResearches: [],
    activeMissions: [],
  });
}

/** Remet l'XP (totale et de saison) de tous les joueurs à zéro. */
export async function adminResetAllXp(onProgress?: (done: number, total: number) => void): Promise<number> {
  const players = await pb.collection("players").getFullList({ fields: "id" });
  let done = 0;
  for (const p of players) {
    await pb.collection("players").update(p.id, { xp: 0, seasonXp: 0, adminReason: "Remise à zéro de l'XP de tous les joueurs" });
    onProgress?.(++done, players.length);
  }
  return players.length;
}

/** Envoie une image dans la collection game_assets et renvoie son URL publique. */
export async function adminUploadAsset(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", file.name);
  const record = await pb.collection("game_assets").create(form);
  return pb.files.getURL(record, record.file as string);
}

/** Clôture manuelle d'une saison terminée (sinon faite par le serveur chaque heure). */
export async function adminCloseSeason(seasonId: string): Promise<{ seasonId: string; closed: boolean; ranked: number; rewarded: number }> {
  try {
    return await pb.send("/api/cosmic/admin/close-season", { method: "POST", body: { seasonId } });
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Clôture impossible.");
  }
}

export interface ResetSummary {
  scope: "all" | "player";
  players: number;
  fleets: number;
  debris: number;
  reports: number;
  alliances: number;
  backup: string;
}

/** Hard reset de la progression (sauvegarde automatique avant, côté serveur). */
export async function adminHardReset(params: { scope: "all" | "player"; uid?: string; confirm: string; options: ResetOptions }): Promise<ResetSummary> {
  try {
    return await pb.send<ResetSummary>("/api/cosmic/admin/reset", { method: "POST", body: params });
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Reset impossible.");
  }
}

/** Passe les factions pour un joueur (force : ultimatum immédiat de `factionId`). */
export async function adminTriggerPirates(uid: string, factionId = "varan", force = true): Promise<{ changed: number }> {
  try {
    return await pb.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid, factionId, force } });
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Impossible.");
  }
}

export interface HooksUpdateReport {
  branch: string;
  updated: string[];
  unchanged: string[];
  errors: string[];
}

/** v4.8 : rapport d'un déploiement complet (sauvegarde, schéma, fiches, hooks). */
export interface DeployReport {
  ref: string;
  backup: string | null;
  schema: number | null;
  profiles: number | null;
  hooks: HooksUpdateReport | null;
  errors: string[];
}

/** v4.8 : sauvegarde + schéma + fiches publiques + hooks, depuis la branche main. */
export async function adminDeploy(ref?: string): Promise<DeployReport> {
  try {
    return await pb.send<DeployReport>("/api/cosmic/admin/deploy", { method: "POST", body: ref ? { ref } : {} });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const data = (err as { response?: Partial<DeployReport> & { message?: string } })?.response;
    if (status === 500 && data && Array.isArray(data.errors)) return data as DeployReport;
    if (status === 404) throw new Error("Route de déploiement absente : les hooks du serveur sont trop anciens (mets-les à jour une fois).");
    throw new Error(data?.message || (err as Error).message);
  }
}

/** Télécharge les hooks du serveur depuis GitHub (pb_hooks/cosmic_updater.pb.js). */
export async function adminUpdateHooks(): Promise<HooksUpdateReport> {
  try {
    return await pb.send<HooksUpdateReport>("/api/cosmic/admin/update-hooks", { method: "POST" });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const message = (err as { response?: { message?: string } })?.response?.message;
    if (status === 404) throw new Error("cosmic_updater.pb.js n'est pas installé sur le serveur (voir README).");
    throw new Error(message || (err as Error).message);
  }
}

/** Statistiques de game design, calculées par le serveur (pb_hooks). */
export async function adminFetchStats(): Promise<GameStats> {
  try {
    return await pb.send<GameStats>("/api/cosmic/admin/stats", { method: "GET" });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) throw new Error("Route absente : mets à jour les hooks du serveur (onglet Outils).");
    throw new Error((err as { response?: { message?: string } })?.response?.message || (err as Error).message);
  }
}

export interface AdminLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: "create" | "update" | "delete" | "reset" | "maintenance";
  targetCollection: string;
  recordId: string;
  recordLabel: string;
  changes: Record<string, unknown>;
  /** v3.5.1 : motif donné pour une édition de joueur. */
  reason?: string;
  createdAtMs: number;
}

/** Journal des actions d'administration (écrit par pb_hooks). */
export async function adminListLogs(page: number, filter = ""): Promise<{ items: AdminLogEntry[]; totalPages: number }> {
  const res = await pb.collection("admin_logs").getList<AdminLogEntry>(page, 30, { sort: "-createdAtMs", filter: filter || undefined });
  return { items: res.items, totalPages: res.totalPages };
}

export interface GameAdmin {
  id: string;
  pseudo: string;
  email: string;
  note: string;
  role: StaffRole;
}

/** Administrateurs du jeu (pseudo et email). */
export async function adminListAdmins(): Promise<GameAdmin[]> {
  try {
    return (await pb.send<{ admins: GameAdmin[] }>("/api/cosmic/admin/admins", { method: "GET" })).admins;
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Liste indisponible.");
  }
}

/** Ajoute ou retire un administrateur (jamais soi-même, jamais le dernier). */
export async function adminManageAdmin(action: "add" | "remove" | "role", uid: string, options: { note?: string; role?: StaffRole } = {}): Promise<GameAdmin[]> {
  try {
    return (await pb.send<{ admins: GameAdmin[] }>("/api/cosmic/admin/admins", { method: "POST", body: { action, uid, ...options } })).admins;
  } catch (err) {
    const data = (err as { response?: { message?: string } }).response;
    throw new Error(data?.message || "Action impossible.");
  }
}

/* ---------- v4.9 : sauvegardes (liste, téléchargement, copie vers R2) ---------- */

export interface BackupFile {
  key: string;
  size: number;
  modifiedAtMs: number;
}

export interface StuckFleet {
  id: string;
  mission: string;
  status: string;
  ownerPseudo: string;
  targetPseudo: string;
  factionId: string;
  dueAtMs: number;
  lateMs: number;
  lastError: { message: string; atMs: number } | null;
}

/** v4.9.3 : flottes que la tâche serveur n'arrive pas à traiter (retard > 10 min). */
export function adminStuckFleets(): Promise<{ thresholdMs: number; count: number; items: StuckFleet[] }> {
  return pb.send("/api/cosmic/admin/stuck-fleets", { method: "GET" });
}

export function adminListBackups(): Promise<BackupFile[]> {
  return pb.send<BackupFile[]>("/api/cosmic/admin/backups/list", { method: "GET" });
}

/** Télécharge une sauvegarde (requête authentifiée, puis fichier proposé au navigateur). */
export async function adminDownloadBackup(key: string): Promise<void> {
  const res = await fetch(pb.buildURL(`/api/cosmic/admin/backups/download?key=${encodeURIComponent(key)}`), { headers: { Authorization: pb.authStore.token } });
  if (!res.ok) throw new Error(`Téléchargement refusé (HTTP ${res.status}).`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = key;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export function adminBackupToR2(): Promise<{ backup: string | null; dispatched: boolean; message: string }> {
  return pb.send("/api/cosmic/admin/backups/r2", { method: "POST", body: {} });
}

/** v5.4 : données réelles de l'outil d'équilibrage. */
export function adminBalance(): Promise<import("@/game/balance/diagnostics").LiveBalance> {
  return pb.send("/api/cosmic/admin/balance", { method: "GET" });
}

/* ---------- v5.4 : générateur procédural ---------- */

export interface ProceduralOverview {
  settings: import("@/game/procedural").ProceduralSettings;
  digest: import("@/game/procedural").WorldDigest;
  difficulty: { value: number; reasons: string[] };
  pending: string[];
  preview: import("@/game/chronicles").ChronicleMonth | null;
  months: { id: string; title: string; boss: string; auto: import("@/game/chronicles").ChapterAuto | null }[];
  achievements: import("@/game/procedural").AchievementProposal[];
}

export interface ProceduralResult {
  chapters: { id: string; title: string; boss: string }[];
  achievements: { id: string; name: string; reason: string }[];
}

export function adminProcedural(): Promise<ProceduralOverview> {
  return pb.send("/api/cosmic/admin/procedural", { method: "GET" });
}

export function adminProceduralSettings(settings: Partial<import("@/game/procedural").ProceduralSettings>): Promise<{ settings: import("@/game/procedural").ProceduralSettings }> {
  return pb.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "settings", settings } });
}

export function adminProceduralGenerate(monthId: string, variant: number, confirmStarted = false): Promise<ProceduralResult> {
  return pb.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "generate", monthId, variant, confirmStarted } });
}

export function adminProceduralAchievements(): Promise<ProceduralResult> {
  return pb.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "achievements" } });
}

/* ---------- v5.5 : actions d'administration sur un joueur ---------- */

export type AdminPlayerAction =
  | { action: "testMode"; on: boolean }
  | { action: "finishAll" }
  | { action: "officers" }
  | { action: "grant"; resources: Partial<Record<string, number>>; reason: string };

export function adminPlayerAction(uid: string, payload: AdminPlayerAction): Promise<Record<string, unknown>> {
  return pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid, ...payload } });
}
