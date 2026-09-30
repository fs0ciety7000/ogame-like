import { isNotFound, pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame, GameActionError } from "@/services/playerService";
import type { Alliance, AllianceLog, AllianceMessage, BattleReport, ResourceId, SpyReport } from "@/types/game";

export class AllianceError extends Error {}

function allianceFromRecord(record: Record<string, unknown>): Alliance {
  const alliance = record as unknown as Alliance;
  return {
    ...alliance,
    members: alliance.members ?? [],
    memberPseudos: alliance.memberPseudos ?? {},
    roles: alliance.roles ?? {},
    treasury: alliance.treasury ?? {},
    research: alliance.research ?? {},
    activeResearch: alliance.activeResearch ?? null,
  };
}

export function subscribeAlliances(cb: (alliances: Alliance[]) => void): () => void {
  let active = true;
  const refresh = () => {
    pb.collection("alliances")
      .getList(1, 100, { sort: "name" })
      .then((res) => active && cb(res.items.map(allianceFromRecord)))
      .catch((err) => console.error("Lecture des alliances impossible :", err));
  };
  refresh();
  const unsubscribe = subscribeRecords("alliances", "*", refresh);
  return () => {
    active = false;
    unsubscribe();
  };
}

export function subscribeAlliance(allianceId: string, cb: (alliance: Alliance | null) => void): () => void {
  let active = true;
  pb.collection("alliances")
    .getOne(allianceId)
    .then((res) => active && cb(allianceFromRecord(res)))
    .catch((err) => active && isNotFound(err) && cb(null));

  const unsubscribe = subscribeRecords("alliances", allianceId, (e) => {
    cb(e.action === "delete" ? null : allianceFromRecord(e.record));
  });
  return () => {
    active = false;
    unsubscribe();
  };
}

/* Actions d'alliance : arbitrées par le serveur (/api/cosmic/alliance). */

async function allianceAction<T = { allianceId: string }>(body: Record<string, unknown>): Promise<T> {
  try {
    return await callGame<T>("alliance", body);
  } catch (err) {
    if (err instanceof GameActionError) throw new AllianceError(err.message);
    throw err;
  }
}

export async function createAlliance(_uid: string, _pseudo: string, name: string, tag: string): Promise<string> {
  return (await allianceAction({ type: "create", name, tag })).allianceId;
}

export async function joinAlliance(_uid: string, _pseudo: string, allianceId: string) {
  await allianceAction({ type: "join", allianceId });
}

export async function leaveAlliance(_uid?: string, _allianceId?: string) {
  await allianceAction({ type: "leave" });
}

export async function depositToTreasury(resources: Partial<Record<ResourceId, number>>) {
  await allianceAction({ type: "deposit", resources });
}

export async function distributeTreasury(targetUid: string, resources: Partial<Record<ResourceId, number>>) {
  await allianceAction({ type: "distribute", targetUid, resources });
}

export async function startAllianceResearch(researchId: string) {
  await allianceAction({ type: "research", researchId });
}

export function subscribeAllianceLogs(allianceId: string, cb: (logs: AllianceLog[]) => void): () => void {
  let active = true;
  const filter = pb.filter("allianceId = {:allianceId}", { allianceId });
  const refresh = () => {
    pb.collection("alliance_logs")
      .getList<AllianceLog>(1, 40, { filter, sort: "-createdAtMs" })
      .then((res) => active && cb(res.items))
      .catch((err) => console.error("Lecture du journal d'alliance impossible :", err));
  };
  refresh();
  const unsubscribe = subscribeRecords("alliance_logs", "*", refresh, filter);
  return () => {
    active = false;
    unsubscribe();
  };
}

export type IntelItem = (SpyReport & { type: "spy" }) | (BattleReport & { type: "battle" });

/** Rapports d'espionnage et de combat récents des membres de mon alliance. */
export async function fetchAllianceIntel(): Promise<IntelItem[]> {
  return (await callGame<{ items: IntelItem[] }>("alliance/intel")).items;
}

export function subscribeAllianceMessages(allianceId: string, cb: (messages: AllianceMessage[]) => void): () => void {
  let active = true;
  const filter = pb.filter("allianceId = {:allianceId}", { allianceId });
  const refresh = () => {
    pb.collection("alliance_messages")
      .getList<AllianceMessage>(1, 50, { filter, sort: "-createdAtMs" })
      .then((res) => active && cb(res.items.reverse()))
      .catch((err) => console.error("Lecture des messages d'alliance impossible :", err));
  };
  refresh();
  const unsubscribe = subscribeRecords("alliance_messages", "*", refresh, filter);
  return () => {
    active = false;
    unsubscribe();
  };
}

export async function sendAllianceMessage(allianceId: string, authorUid: string, authorPseudo: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 500) throw new AllianceError("Message trop long (500 caractères max).");
  
  await pb.collection("alliance_messages").create({
    allianceId,
    authorUid,
    authorPseudo,
    text: trimmed,
    createdAtMs: Date.now(),
  });
}

export async function markAllianceRead(uid: string) {
  await pb.collection("players").update(uid, { allianceLastReadMs: Date.now() });
}

export async function promoteToOfficer(_actorUid: string, _allianceId: string, targetUid: string) {
  await allianceAction({ type: "promote", targetUid });
}

export async function demoteOfficer(_actorUid: string, _allianceId: string, targetUid: string) {
  await allianceAction({ type: "demote", targetUid });
}

export async function kickMember(_actorUid: string, _allianceId: string, targetUid: string) {
  await allianceAction({ type: "kick", targetUid });
}
