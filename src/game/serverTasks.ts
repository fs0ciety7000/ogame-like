/* =====================================================
   6.14.111 (AU27, lot AC-E, constats AC-7, AC-8, AC-10) : tâches planifiées.
   - Verrou par cadence : une cadence (minute, 5 min, 10 min) ne démarre
     pas tant que la précédente tourne encore ; un verrou plus vieux que
     `lockFactor` × l'intervalle est tenu pour mort (arrêt brutal). Une
     cadence sautée est comptée (page Santé du serveur).
   - E-mails par lots : une campagne entre dans une file (`mail_queue`,
     collection `server_metrics`, lisible par l'équipe seulement) ; l'étape
     `cosmic_mail_queue` de la cadence minute en envoie `mailBatchSize`
     par passage, avec `mailPauseMs` entre deux envois.
   - Échéances et maintenance (Q77 = Q-AC2, option B) : pendant une
     maintenance, guerres, Léviathan, boss d'alliance et de saison, guerre
     de territoire attendent ; à la fin, leurs échéances sont décalées de la
     durée de la coupure. Les flottes continuent.
   Module sans import : le registre, le serveur et les tests le lisent sans cycle.
   Registre « serverTasks » (règle n° 2).
===================================================== */

export const SERVER_TASK_RULES = {
  /** Durée de vie d'un verrou de cadence, en intervalles (2 : une cadence de 5 min bloquée plus de 10 min est tenue pour morte). */
  lockFactor: 2,
  /** E-mails envoyés par passage de la cadence minute. */
  mailBatchSize: 50,
  /** Pause entre deux e-mails (limite du fournisseur : 2 par seconde). */
  mailPauseMs: 600,
  /** Flottes dues traitées au plus par passage de la tâche minute (par paquets de 50). */
  fleetsPerPass: 200,
  /** Durée au-delà de laquelle la tâche des flottes s'arrête (le reste attend le passage suivant). */
  fleetsPassSeconds: 40,
  /** Joueurs par transaction pour les tâches qui touchent tous les joueurs (rattrapage de la nuit, rappels du Comptoir). */
  playersPerTransaction: 100,
  /** Q77 : pendant une maintenance, les échéances collectives attendent et sont décalées de sa durée à la fin. */
  maintenanceShiftsDeadlines: true,
};

export const SERVER_TASK_RULES_META = {
  lockFactor: { label: "Verrou d'une cadence : durée de vie (en intervalles)", unit: "×", min: 1, max: 10, hint: "Au-delà, une cadence restée bloquée (arrêt brutal) est tenue pour morte et la suivante démarre." },
  mailBatchSize: { label: "E-mails envoyés par minute (par lot)", min: 1, max: 90, hint: "Avec la pause entre deux envois, un lot doit tenir sous 60 s (50 × 0,6 s = 30 s)." },
  mailPauseMs: { label: "Pause entre deux e-mails", unit: "ms", min: 0, max: 5000, hint: "Limite du fournisseur : 600 ms = 2 envois par seconde (Resend)." },
  fleetsPerPass: { label: "Flottes dues traitées au plus par minute", min: 50, max: 2000 },
  fleetsPassSeconds: { label: "Tâche des flottes : durée maximale d'un passage", unit: "s", min: 5, max: 55 },
  playersPerTransaction: { label: "Joueurs par transaction (rattrapage de la nuit, rappels du Comptoir)", min: 10, max: 1000, hint: "Une transaction tient le verrou d'écriture : plus petite, les actions des joueurs attendent moins." },
  maintenanceShiftsDeadlines: { label: "Maintenance : échéances collectives suspendues puis décalées (Q77)", hint: "Guerres, Léviathan, boss d'alliance et de saison, guerre de territoire ; les flottes continuent." },
} as const;

const num = (x: unknown, d: number) => (Number.isFinite(Number(x)) ? Number(x) : d);

/** Une cadence tient-elle encore son verrou ? (`lockAtMs` : début du passage en cours, 0 ou absent : libre) */
export function cadenceBusy(lockAtMs: unknown, now: number, everyMs: number): boolean {
  const at = num(lockAtMs, 0);
  if (!(at > 0) || at > now) return false;
  return now - at < Math.max(1, num(SERVER_TASK_RULES.lockFactor, 2)) * Math.max(1, everyMs);
}

/* ---------- e-mails par lots ---------- */

export const MAIL_QUEUE_KEY = "mail_queue";

export interface MailQueueJob {
  /** Identifiant de la campagne (historique `mail_campaigns`). */
  id: string;
  subject: string;
  html: string;
  text: string;
  fromName: string;
  apiUrl: string;
  createdAtMs: number;
  /** Destinataires restants, dans l'ordre (identifiants de joueur ; l'adresse est relue à l'envoi). */
  uids: string[];
  total: number;
  sent: number;
  failed: number;
  /** Pseudos en échec (20 au plus). */
  failedPseudos: string[];
}

export interface MailQueue {
  jobs: MailQueueJob[];
}

const str = (x: unknown) => (typeof x === "string" ? x : "");

export function mailQueueState(raw: unknown): MailQueue {
  const r = (raw && typeof raw === "object" ? raw : {}) as { jobs?: unknown };
  const jobs = Array.isArray(r.jobs) ? r.jobs : [];
  return {
    jobs: jobs
      .filter((j): j is Record<string, unknown> => !!j && typeof j === "object" && typeof (j as { id?: unknown }).id === "string")
      .map((j) => ({
        id: String(j.id),
        subject: str(j.subject),
        html: str(j.html),
        text: str(j.text),
        fromName: str(j.fromName),
        apiUrl: str(j.apiUrl),
        createdAtMs: num(j.createdAtMs, 0),
        uids: Array.isArray(j.uids) ? j.uids.filter((u): u is string => typeof u === "string") : [],
        total: Math.max(0, Math.floor(num(j.total, 0))),
        sent: Math.max(0, Math.floor(num(j.sent, 0))),
        failed: Math.max(0, Math.floor(num(j.failed, 0))),
        failedPseudos: Array.isArray(j.failedPseudos) ? j.failedPseudos.map(String).slice(0, 20) : [],
      })),
  };
}

/** Retire le prochain lot de la file (première campagne d'abord). Rend le lot et la file sans lui ; un envoi interrompu
 *  perd au plus ce lot (au plus une fois : jamais deux e-mails au même joueur). */
export function takeMailBatch(queue: MailQueue, size: number = SERVER_TASK_RULES.mailBatchSize): { job: MailQueueJob | null; uids: string[]; queue: MailQueue } {
  const n = Math.max(1, Math.floor(num(size, 50)));
  const jobs = queue.jobs.filter((j) => j.uids.length > 0);
  const job = jobs[0];
  if (!job) return { job: null, uids: [], queue: { jobs: [] } };
  const uids = job.uids.slice(0, n);
  const rest = { ...job, uids: job.uids.slice(n) };
  return { job, uids, queue: { jobs: [rest, ...jobs.slice(1)] } };
}

/** Compte le résultat d'un lot ; une campagne finie quitte la file. */
export function settleMailBatch(queue: MailQueue, jobId: string, sent: number, failedPseudos: string[]): { queue: MailQueue; job: MailQueueJob | null; done: boolean } {
  let job: MailQueueJob | null = null;
  const jobs = queue.jobs.map((j) => {
    if (j.id !== jobId) return j;
    job = { ...j, sent: j.sent + sent, failed: j.failed + failedPseudos.length, failedPseudos: [...j.failedPseudos, ...failedPseudos].slice(0, 20) };
    return job;
  });
  const done = !!job && (job as MailQueueJob).uids.length === 0;
  return { queue: { jobs: jobs.filter((j) => j.uids.length > 0) }, job, done };
}

/* ---------- échéances et maintenance (Q77) ---------- */

/** Décale une échéance collective de la durée d'une maintenance (de `fromMs` à `toMs`) : seulement si elle tournait encore
 *  au début de la coupure. Les dates passées avant la coupure ne bougent pas. Rend `null` si rien ne change. */
export function shiftForMaintenance<T extends { startMs?: number; endMs: number; status?: string }>(state: T | null | undefined, fromMs: number, toMs: number, openStatuses: readonly string[] = ["active"]): T | null {
  if (!state || !SERVER_TASK_RULES.maintenanceShiftsDeadlines) return null;
  const d = Math.round(toMs - fromMs);
  if (!(d > 0) || !(fromMs > 0)) return null;
  if (state.status !== undefined && !openStatuses.includes(state.status)) return null;
  if (!(num(state.endMs, 0) > fromMs)) return null;
  const next = { ...state, endMs: state.endMs + d };
  if (num(state.startMs, 0) > fromMs) next.startMs = (state.startMs as number) + d;
  return next;
}
