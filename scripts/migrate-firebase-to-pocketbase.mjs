// Copie les données du jeu de Firebase (Auth + Firestore) vers PocketBase.
//
//   npm install                       # installe firebase-admin (devDependency)
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
//   PB_URL=https://… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
//   node scripts/migrate-firebase-to-pocketbase.mjs [--dry-run] [--send-reset-emails]
//
// Prérequis : le schéma est installé (node pocketbase/setup.mjs).
//
// - Comptes : recréés dans `users` avec le même email et le même pseudo.
//   Les mots de passe Firebase ne sont pas transférables (hachage
//   différent) : chaque compte reçoit un mot de passe provisoire, listé
//   dans migration-output/passwords.csv (à transmettre en privé aux
//   joueurs, qui le changent ensuite dans Réglages). Avec
//   --send-reset-emails, PocketBase envoie aussi un lien de
//   réinitialisation aux comptes qui ont un vrai email (SMTP requis).
// - Joueurs, files d'attente, notifications, alliances + messages,
//   rapports de combat/espionnage, dons : copiés avec les identifiants
//   Firebase remplacés par les nouveaux identifiants PocketBase.
// - Relançable : un compte dont l'email existe déjà dans PocketBase est
//   réutilisé, et les enregistrements déjà copiés sont mis à jour.
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import PocketBase from "pocketbase";

const DRY_RUN = process.argv.includes("--dry-run");
const SEND_RESET = process.argv.includes("--send-reset-emails");
const LEGACY_DOMAIN = "@cosmic-empires.local";
const KEEP_NOTIFICATIONS = 50;

/* ---------- utilitaires purs (exportés pour les tests) ---------- */

/** Timestamps Firestore -> millisecondes, récursivement. */
export function plain(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "object" && typeof value.toMillis === "function") return value.toMillis();
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}

export function sanitizePseudo(pseudo) {
  return String(pseudo ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

/** Identifiant PocketBase (15 caractères a-z0-9) dérivé de façon stable
 *  d'un identifiant Firebase : relancer le script retombe sur les mêmes
 *  enregistrements au lieu de créer des doublons. */
export function pbId(kind, firebaseId) {
  const hash = createHash("sha256").update(`${kind}:${firebaseId}`).digest();
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 15; i++) out += alphabet[hash[i] % alphabet.length];
  return out;
}

function tempPassword() {
  return randomBytes(9).toString("base64url");
}

/* ---------- lecture Firebase ---------- */

async function readFirebase() {
  const { initializeApp, applicationDefault } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault() });
  const auth = getAuth();
  const db = getFirestore();
  // REST plutôt que gRPC : passe les proxys/pare-feux d'entreprise.
  db.settings({ preferRest: true });

  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users.map((u) => ({ uid: u.uid, email: u.email ?? "", displayName: u.displayName ?? "" })));
    pageToken = page.pageToken;
  } while (pageToken);

  const docs = async (ref) => (await ref.get()).docs.map((d) => ({ id: d.id, ...plain(d.data()) }));

  const players = [];
  for (const p of await docs(db.collection("players"))) {
    const queuesSnap = await db.doc(`players/${p.id}/meta/queues`).get();
    players.push({
      ...p,
      queues: queuesSnap.exists ? plain(queuesSnap.data()) : null,
      notifications: await docs(db.collection(`players/${p.id}/notifications`)),
    });
  }

  const alliances = [];
  for (const a of await docs(db.collection("alliances"))) {
    alliances.push({ ...a, messages: await docs(db.collection(`alliances/${a.id}/messages`)) });
  }

  return {
    users,
    players,
    alliances,
    battleReports: await docs(db.collection("battle_reports")),
    spyReports: await docs(db.collection("spy_reports")),
    gifts: await docs(db.collection("resource_gifts")),
  };
}

/* ---------- écriture PocketBase ---------- */

export async function writePocketBase(pb, data, { dryRun = false, sendReset = false, log = console.log } = {}) {
  const uidMap = new Map(); // uid Firebase -> id PocketBase
  const passwords = [];
  const playersByUid = new Map(data.players.map((p) => [p.id, p]));

  async function upsert(collection, id, record) {
    if (dryRun) return;
    try {
      await pb.collection(collection).create({ ...record, id });
    } catch (err) {
      // Déjà copié lors d'un précédent passage : mise à jour.
      if (err?.status !== 400 || !err?.response?.data?.id) throw err;
      await pb.collection(collection).update(id, record);
    }
  }

  // 1. Comptes
  const takenUsernames = new Set();
  for (const user of data.users) {
    const player = playersByUid.get(user.uid);
    const pseudo = player?.pseudo || user.displayName || user.email.split("@")[0];
    let username = sanitizePseudo(pseudo) || `joueur${user.uid.slice(0, 6).toLowerCase()}`;
    while (takenUsernames.has(username)) username += "_";
    takenUsernames.add(username);

    const email = user.email || `${username}${LEGACY_DOMAIN}`;
    let existing = null;
    try {
      existing = await pb.collection("users").getFirstListItem(pb.filter("email = {:email}", { email }));
    } catch (err) {
      if (err?.status !== 404) throw err;
    }

    if (existing) {
      uidMap.set(user.uid, existing.id);
      log(`= compte existant ${email}`);
      continue;
    }

    const id = pbId("user", user.uid);
    uidMap.set(user.uid, id);
    const password = tempPassword();
    passwords.push({ pseudo, email, password });
    if (!dryRun) {
      await pb.collection("users").create({
        id,
        email,
        emailVisibility: false,
        verified: true,
        username,
        name: pseudo,
        password,
        passwordConfirm: password,
      });
      if (sendReset && !email.endsWith(LEGACY_DOMAIN)) {
        await pb.collection("users").requestPasswordReset(email).catch((e) => log(`! reset ${email} : ${e.message}`));
      }
    }
    log(`+ compte ${pseudo} <${email}>`);
  }

  const mapUid = (uid) => uidMap.get(uid) ?? "";
  const mapKeys = (obj) =>
    Object.fromEntries(Object.entries(obj ?? {}).filter(([k]) => uidMap.has(k)).map(([k, v]) => [mapUid(k), v]));
  const allianceMap = new Map(data.alliances.map((a) => [a.id, pbId("alliance", a.id)]));

  // 2. Joueurs, files d'attente, notifications
  for (const p of data.players) {
    const id = uidMap.get(p.id);
    if (!id) {
      log(`! joueur ${p.pseudo ?? p.id} sans compte Firebase Auth : ignoré`);
      continue;
    }
    const { queues, notifications, uid: _uid, createdAt, allianceId, id: _fid, ...state } = p;
    await upsert("players", id, {
      ...state,
      allianceId: allianceId ? (allianceMap.get(allianceId) ?? "") : "",
      createdAtMs: typeof createdAt === "number" ? createdAt : Date.now(),
    });
    if (queues) await upsert("queues", id, queues);
    // Le jeu n'affiche que les 30 dernières : inutile de copier tout l'historique.
    const recent = [...notifications].sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)).slice(0, KEEP_NOTIFICATIONS);
    for (const n of recent) {
      const { id: nid, ...rest } = n;
      await upsert("notifications", pbId("notif", `${p.id}/${nid}`), { ...rest, player_id: id });
    }
    log(`+ joueur ${p.pseudo} (${recent.length}/${notifications.length} notifications)`);
  }

  // 3. Alliances et messages
  for (const a of data.alliances) {
    const id = allianceMap.get(a.id);
    const { messages, createdAt, id: _fid, ...rest } = a;
    await upsert("alliances", id, {
      ...rest,
      createdBy: mapUid(a.createdBy),
      createdAtMs: typeof createdAt === "number" ? createdAt : Date.now(),
      members: (a.members ?? []).filter((m) => uidMap.has(m)).map(mapUid),
      memberPseudos: mapKeys(a.memberPseudos),
      roles: mapKeys(a.roles),
    });
    for (const m of messages) {
      const { id: mid, ...msg } = m;
      await upsert("alliance_messages", pbId("msg", `${a.id}/${mid}`), {
        ...msg,
        allianceId: id,
        authorUid: mapUid(m.authorUid),
      });
    }
    log(`+ alliance [${a.tag}] ${a.name} (${messages.length} messages)`);
  }

  // 4. Rapports et dons
  const ts = (v) => (typeof v === "number" ? v : Date.now());
  for (const r of data.battleReports) {
    const { id: rid, ...rest } = r;
    await upsert("battle_reports", pbId("battle", rid), {
      ...rest,
      attackerUid: mapUid(r.attackerUid),
      defenderUid: mapUid(r.defenderUid),
      timestamp: ts(r.timestamp),
    });
  }
  for (const r of data.spyReports) {
    const { id: rid, ...rest } = r;
    await upsert("spy_reports", pbId("spy", rid), {
      ...rest,
      spyUid: mapUid(r.spyUid),
      targetUid: mapUid(r.targetUid),
      timestamp: ts(r.timestamp),
    });
  }
  for (const g of data.gifts) {
    const { id: gid, ...rest } = g;
    await upsert("resource_gifts", pbId("gift", gid), {
      ...rest,
      fromUid: mapUid(g.fromUid),
      toUid: mapUid(g.toUid),
      timestamp: ts(g.timestamp),
    });
  }
  log(`+ ${data.battleReports.length} rapports de combat, ${data.spyReports.length} d'espionnage, ${data.gifts.length} dons`);

  return { passwords, uidMap };
}

/* ---------- point d'entrée ---------- */

async function main() {
  const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
  if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error("Renseigne GOOGLE_APPLICATION_CREDENTIALS, PB_URL, PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD.");
    process.exit(1);
  }

  console.log("Lecture de Firebase…");
  const data = await readFirebase();
  console.log(
    `${data.users.length} comptes, ${data.players.length} joueurs, ${data.alliances.length} alliances, ` +
      `${data.battleReports.length} rapports de combat.`,
  );

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

  console.log(DRY_RUN ? "Simulation (rien n'est écrit)…" : "Écriture dans PocketBase…");
  const { passwords } = await writePocketBase(pb, data, { dryRun: DRY_RUN, sendReset: SEND_RESET });

  if (!DRY_RUN && passwords.length > 0) {
    mkdirSync("migration-output", { recursive: true });
    const csv = ["pseudo,email,mot_de_passe_provisoire", ...passwords.map((p) => `${p.pseudo},${p.email},${p.password}`)];
    writeFileSync("migration-output/passwords.csv", csv.join("\n") + "\n", { mode: 0o600 });
    console.log(`Mots de passe provisoires : migration-output/passwords.csv (${passwords.length} comptes). À garder privé !`);
  }
  console.log("Terminé.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err?.response ?? err);
    process.exit(1);
  });
}
