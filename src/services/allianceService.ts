import { ClientResponseError } from "pocketbase";
import { isNotFound, pb, subscribeRecords } from "@/lib/pocketbase";
import type { Alliance, AllianceMessage } from "@/types/game";

export class AllianceError extends Error {}

function allianceFromRecord(record: Record<string, unknown>): Alliance {
  const alliance = record as unknown as Alliance;
  return {
    ...alliance,
    members: alliance.members ?? [],
    memberPseudos: alliance.memberPseudos ?? {},
    roles: alliance.roles ?? {},
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

export async function createAlliance(uid: string, pseudo: string, name: string, tag: string): Promise<string> {
  const trimmedName = name.trim();
  const trimmedTag = tag.trim().toUpperCase();
  if (trimmedName.length < 3) throw new AllianceError("Le nom doit contenir au moins 3 caractères.");
  if (trimmedTag.length < 2 || trimmedTag.length > 5) throw new AllianceError("Le tag doit contenir entre 2 et 5 caractères.");

  let alliance;
  try {
    alliance = await pb.collection("alliances").create({
      name: trimmedName,
      tag: trimmedTag,
      createdBy: uid,
      createdAtMs: Date.now(),
      members: [uid],
      memberPseudos: { [uid]: pseudo },
      roles: {},
    });
  } catch (err) {
    const fields = err instanceof ClientResponseError ? (err.response?.data ?? {}) : {};
    if ((fields as Record<string, { code?: string }>).tag?.code === "validation_not_unique") {
      throw new AllianceError("Ce tag est déjà utilisé par une autre alliance.");
    }
    throw err;
  }

  await pb.collection("players").update(uid, { allianceId: alliance.id });
  return alliance.id;
}

export async function joinAlliance(uid: string, pseudo: string, allianceId: string) {
  const alliance = await pb.collection("alliances").getOne(allianceId);
  if ((alliance.members ?? []).includes(uid)) throw new AllianceError("Tu es déjà membre de cette alliance.");

  const newMembers = [...(alliance.members ?? []), uid];
  const newPseudos = { ...alliance.memberPseudos, [uid]: pseudo };

  await pb.collection("alliances").update(allianceId, {
    members: newMembers,
    memberPseudos: newPseudos,
  });
  
  await pb.collection("players").update(uid, { allianceId });
}

export async function leaveAlliance(uid: string, allianceId: string) {
  try {
    const alliance = await pb.collection("alliances").getOne(allianceId);
    const newMembers = (alliance.members ?? []).filter((m: string) => m !== uid);
    const newPseudos = { ...alliance.memberPseudos };
    delete newPseudos[uid];

    await pb.collection("alliances").update(allianceId, {
      members: newMembers,
      memberPseudos: newPseudos,
    });
  } catch {
    // L'alliance n'existe peut-être plus
  }
  
  await pb.collection("players").update(uid, { allianceId: "" });
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

export async function promoteToOfficer(actorUid: string, allianceId: string, targetUid: string) {
  const alliance = await pb.collection("alliances").getOne(allianceId);
  if (alliance.createdBy !== actorUid) throw new AllianceError("Seul le fondateur peut promouvoir un officier.");
  if (!(alliance.members ?? []).includes(targetUid)) throw new AllianceError("Ce joueur n'est pas membre de l'alliance.");
  
  const roles = { ...(alliance.roles ?? {}), [targetUid]: "officer" };
  await pb.collection("alliances").update(allianceId, { roles });
}

export async function demoteOfficer(actorUid: string, allianceId: string, targetUid: string) {
  const alliance = await pb.collection("alliances").getOne(allianceId);
  if (alliance.createdBy !== actorUid) throw new AllianceError("Seul le fondateur peut rétrograder un officier.");
  
  const roles = { ...(alliance.roles ?? {}) };
  delete roles[targetUid];
  await pb.collection("alliances").update(allianceId, { roles });
}

export async function kickMember(actorUid: string, allianceId: string, targetUid: string) {
  if (targetUid === actorUid) throw new AllianceError("Tu ne peux pas t'exclure toi-même.");
  
  const alliance = await pb.collection("alliances").getOne(allianceId);
  if (alliance.createdBy !== actorUid) throw new AllianceError("Seul le fondateur peut exclure un membre.");
  if (!(alliance.members ?? []).includes(targetUid)) throw new AllianceError("Ce joueur n'est pas membre de l'alliance.");

  const newMembers = (alliance.members ?? []).filter((m: string) => m !== targetUid);
  const newPseudos = { ...alliance.memberPseudos };
  delete newPseudos[targetUid];
  const roles = { ...(alliance.roles ?? {}) };
  delete roles[targetUid];

  await pb.collection("alliances").update(allianceId, {
    members: newMembers,
    memberPseudos: newPseudos,
    roles,
  });
}

export async function clearOwnAllianceId(uid: string) {
  await pb.collection("players").update(uid, { allianceId: "" });
}