import { describe, expect, it } from "vitest";
import { cadenceBusy, mailQueueState, settleMailBatch, shiftForMaintenance, SERVER_TASK_RULES, takeMailBatch } from "@/game/serverTasks";
import { cronStatus, normalizeCronMetrics, recordCronRun, recordCronSkip } from "@/game/serverMetrics";

/* 6.14.111 (AU27, lot AC-E) : tâches planifiées. */

const NOW = Date.UTC(2026, 9, 8, 12);
const MIN = 60_000;

describe("verrou par cadence", () => {
  it("libre sans verrou, occupé pendant 2 intervalles, mort au-delà", () => {
    expect(cadenceBusy(0, NOW, 5 * MIN)).toBe(false);
    expect(cadenceBusy(undefined, NOW, 5 * MIN)).toBe(false);
    expect(cadenceBusy(NOW - 4 * MIN, NOW, 5 * MIN)).toBe(true);
    expect(cadenceBusy(NOW - 9 * MIN, NOW, 5 * MIN)).toBe(true);
    expect(cadenceBusy(NOW - 10 * MIN, NOW, 5 * MIN)).toBe(false);
    // Verrou daté dans le futur (horloge reculée) : ignoré plutôt que bloquer.
    expect(cadenceBusy(NOW + MIN, NOW, 5 * MIN)).toBe(false);
  });

  it("un passage sauté est compté sans changer le dernier passage réel (la cadence finit « en retard »)", () => {
    let m = recordCronRun({}, "cosmic_wars", "*/5 * * * *", NOW - 30 * MIN, 1200, null);
    m = recordCronSkip(m, "cosmic_wars", "*/5 * * * *", NOW);
    m = recordCronSkip(m, "cosmic_wars", "*/5 * * * *", NOW + 5 * MIN);
    expect(m.cosmic_wars.skips).toBe(2);
    expect(m.cosmic_wars.lastSkipAtMs).toBe(NOW + 5 * MIN);
    expect(m.cosmic_wars.lastAtMs).toBe(NOW - 30 * MIN);
    expect(cronStatus(m.cosmic_wars, NOW + 5 * MIN)).toBe("late");
    // Relu depuis la mémoire du serveur (JSON), puis un vrai passage : le compteur reste.
    const back = normalizeCronMetrics(JSON.parse(JSON.stringify(m)));
    expect(recordCronRun(back, "cosmic_wars", "*/5 * * * *", NOW + 10 * MIN, 900, null).cosmic_wars.skips).toBe(2);
  });
});

describe("e-mails par lots", () => {
  const job = (id: string, n: number) => ({ id, subject: "S", html: "<p>x</p>", text: "x", fromName: "", apiUrl: "https://x", createdAtMs: NOW, uids: Array.from({ length: n }, (_, i) => `${id}u${i}`), total: n, sent: 0, failed: 0, failedPseudos: [] });

  it("un lot à la fois, campagne par campagne, au plus une fois par destinataire", () => {
    let queue = mailQueueState({ jobs: [job("a", 5), job("b", 2)] });
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      const t = takeMailBatch(queue, 2);
      if (!t.job) break;
      seen.push(...t.uids);
      queue = settleMailBatch(t.queue, t.job.id, t.uids.length, []).queue;
    }
    expect(seen).toEqual(["au0", "au1", "au2", "au3", "au4", "bu0", "bu1"]);
    expect(new Set(seen).size).toBe(seen.length);
    expect(queue.jobs).toHaveLength(0);
  });

  it("compte envoyés et échecs, garde au plus 20 pseudos en échec", () => {
    const t = takeMailBatch(mailQueueState({ jobs: [job("a", 30)] }), 25);
    const failed = Array.from({ length: 25 }, (_, i) => `p${i}`);
    const out = settleMailBatch(t.queue, "a", 0, failed);
    expect(out.job?.failed).toBe(25);
    expect(out.job?.failedPseudos).toHaveLength(20);
    expect(out.done).toBe(false);
    expect(out.queue.jobs[0].uids).toHaveLength(5);
  });

  it("file vide ou abîmée : rien à envoyer", () => {
    expect(takeMailBatch(mailQueueState(null)).job).toBeNull();
    expect(mailQueueState({ jobs: [{ nope: 1 }, null, "x"] }).jobs).toHaveLength(0);
    expect(SERVER_TASK_RULES.mailBatchSize * SERVER_TASK_RULES.mailPauseMs).toBeLessThan(60_000);
  });
});

describe("échéances et maintenance (Q77)", () => {
  const from = NOW - 2 * 3_600_000;
  it("une échéance encore ouverte au début de la coupure est décalée de sa durée", () => {
    const boss = { id: "b", startMs: NOW - 24 * 3_600_000, endMs: NOW + 3_600_000, status: "active" };
    expect(shiftForMaintenance(boss, from, NOW)).toMatchObject({ endMs: NOW + 3 * 3_600_000, startMs: boss.startMs });
  });

  it("une guerre en préparation pendant la coupure : début et fin décalés", () => {
    const war = { startMs: NOW - 3_600_000, endMs: NOW + 48 * 3_600_000, status: "preparing" };
    expect(shiftForMaintenance(war, from, NOW, ["preparing", "active"])).toMatchObject({ startMs: NOW + 3_600_000, endMs: NOW + 50 * 3_600_000 });
  });

  it("rien ne bouge : échéance passée avant la coupure, combat clos, réglage coupé", () => {
    expect(shiftForMaintenance({ endMs: from - 1, status: "active" }, from, NOW)).toBeNull();
    expect(shiftForMaintenance({ endMs: NOW + 1, status: "killed" }, from, NOW)).toBeNull();
    expect(shiftForMaintenance(null, from, NOW)).toBeNull();
    const saved = SERVER_TASK_RULES.maintenanceShiftsDeadlines;
    SERVER_TASK_RULES.maintenanceShiftsDeadlines = false;
    try {
      expect(shiftForMaintenance({ endMs: NOW + 1, status: "active" }, from, NOW)).toBeNull();
    } finally {
      SERVER_TASK_RULES.maintenanceShiftsDeadlines = saved;
    }
  });
});
