import {
  collection,
  doc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Alliance, AllianceMessage } from "@/types/game";

const alliancesCol = () => collection(db, "alliances");
const allianceRef = (id: string) => doc(db, "alliances", id);
const messagesCol = (allianceId: string) => collection(db, "alliances", allianceId, "messages");
const playerRef = (uid: string) => doc(db, "players", uid);

export class AllianceError extends Error {}

export function subscribeAlliances(cb: (alliances: Alliance[]) => void): Unsubscribe {
  const q = query(alliancesCol(), orderBy("name"), fsLimit(100));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Alliance, "id">) }))));
}

export function subscribeAlliance(allianceId: string, cb: (alliance: Alliance | null) => void): Unsubscribe {
  return onSnapshot(allianceRef(allianceId), (snap) =>
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Alliance, "id">) }) : null),
  );
}

export async function createAlliance(uid: string, pseudo: string, name: string, tag: string): Promise<string> {
  const trimmedName = name.trim();
  const trimmedTag = tag.trim().toUpperCase();
  if (trimmedName.length < 3) throw new AllianceError("Le nom doit contenir au moins 3 caractères.");
  if (trimmedTag.length < 2 || trimmedTag.length > 5) throw new AllianceError("Le tag doit contenir entre 2 et 5 caractères.");

  const ref = doc(alliancesCol());
  await setDoc(ref, {
    name: trimmedName,
    tag: trimmedTag,
    createdBy: uid,
    createdAt: serverTimestamp(),
    members: [uid],
    memberPseudos: { [uid]: pseudo },
  });
  await setDoc(playerRef(uid), { allianceId: ref.id }, { merge: true });
  return ref.id;
}

export async function joinAlliance(uid: string, pseudo: string, allianceId: string) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(allianceRef(allianceId));
    if (!snap.exists()) throw new AllianceError("Alliance introuvable.");
    const data = snap.data() as Omit<Alliance, "id">;
    if (data.members.includes(uid)) throw new AllianceError("Tu es déjà membre de cette alliance.");

    tx.update(allianceRef(allianceId), {
      members: [...data.members, uid],
      memberPseudos: { ...data.memberPseudos, [uid]: pseudo },
    });
    tx.set(playerRef(uid), { allianceId }, { merge: true });
  });
}

export async function leaveAlliance(uid: string, allianceId: string) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(allianceRef(allianceId));
    if (snap.exists()) {
      const data = snap.data() as Omit<Alliance, "id">;
      const memberPseudos = { ...data.memberPseudos };
      delete memberPseudos[uid];
      tx.update(allianceRef(allianceId), {
        members: data.members.filter((m) => m !== uid),
        memberPseudos,
      });
    }
    tx.set(playerRef(uid), { allianceId: null }, { merge: true });
  });
}

export function subscribeAllianceMessages(allianceId: string, cb: (messages: AllianceMessage[]) => void): Unsubscribe {
  const q = query(messagesCol(allianceId), orderBy("createdAtMs", "desc"), fsLimit(50));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AllianceMessage, "id">) })).reverse()),
  );
}

export async function sendAllianceMessage(allianceId: string, authorUid: string, authorPseudo: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (trimmed.length > 500) throw new AllianceError("Message trop long (500 caractères max).");
  await setDoc(doc(messagesCol(allianceId)), {
    authorUid,
    authorPseudo,
    text: trimmed,
    createdAtMs: Date.now(),
  });
}
