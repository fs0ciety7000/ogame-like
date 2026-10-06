import { afterEach, describe, expect, it, vi } from "vitest";
import { nowTickerDebug, subscribeNowTicker } from "@/hooks/useNowTicker";

/* 5.29 (P2) : une seule horloge pour tous les décomptes. */

afterEach(() => {
  vi.useRealTimers();
});

describe("useNowTicker : horloge partagée", () => {
  it("un seul minuteur pour plusieurs abonnés, arrêté au dernier départ", () => {
    vi.useFakeTimers();
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribeNowTicker(a);
    const offB = subscribeNowTicker(b);
    expect(nowTickerDebug()).toEqual({ listeners: 2, running: true });
    vi.advanceTimersByTime(3100);
    expect(a.mock.calls.length).toBe(3);
    expect(b.mock.calls.length).toBe(3);
    offA();
    expect(nowTickerDebug().running).toBe(true);
    offB();
    expect(nowTickerDebug()).toEqual({ listeners: 0, running: false });
    vi.advanceTimersByTime(5000);
    expect(a.mock.calls.length).toBe(3);
  });
});
