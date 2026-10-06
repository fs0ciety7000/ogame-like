import { describe, expect, it, vi } from "vitest";
import { coalesce, createSharedSubscriber } from "@/lib/sharedSubscriptions";

describe("abonnements partagés", () => {
  it("n'ouvre qu'un flux par clé et le ferme au dernier départ", async () => {
    const sub = createSharedSubscriber<number>();
    let emit: (n: number) => void = () => undefined;
    const close = vi.fn();
    const open = vi.fn(async (e: (n: number) => void) => {
      emit = e;
      return close;
    });
    const a: number[] = [];
    const b: number[] = [];
    const offA = sub.subscribe("k", open, (n) => a.push(n));
    const offB = sub.subscribe("k", open, (n) => b.push(n));
    await Promise.resolve();
    expect(open).toHaveBeenCalledTimes(1);
    emit(1);
    expect(a).toEqual([1]);
    expect(b).toEqual([1]);
    offA();
    emit(2);
    expect(a).toEqual([1]);
    expect(sub.stats()).toEqual({ channels: 1, listeners: 1 });
    offB();
    expect(close).toHaveBeenCalledTimes(1);
    expect(sub.stats().channels).toBe(0);
  });

  it("ferme un flux dont l'ouverture se termine après le départ", async () => {
    const sub = createSharedSubscriber<number>();
    const close = vi.fn();
    const off = sub.subscribe("k", async () => close, () => undefined);
    off();
    await Promise.resolve();
    await Promise.resolve();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("regroupe les appels rapprochés", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const c = coalesce(fn, 100);
    c();
    c();
    c();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
