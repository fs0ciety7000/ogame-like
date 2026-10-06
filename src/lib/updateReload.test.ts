import { describe, expect, it, vi } from "vitest";
import { importWithRetry, isStaleChunkError } from "@/lib/updateReload";

describe("fichiers d'une ancienne version", () => {
  it("reconnaît l'erreur MIME text/html (fichier remplacé par la page d'accueil)", () => {
    expect(isStaleChunkError(new TypeError("'text/html' is not a valid JavaScript MIME type."))).toBe(true);
    expect(isStaleChunkError(new Error("x is undefined"))).toBe(false);
  });

  it("retente l'import pendant une mise en ligne, abandonne ensuite ; les autres erreurs passent tout de suite", async () => {
    const stale = new TypeError("'text/html' is not a valid JavaScript MIME type.");
    const flaky = vi.fn().mockRejectedValueOnce(stale).mockResolvedValueOnce("ok");
    await expect(importWithRetry(flaky, [1, 1])).resolves.toBe("ok");
    const dead = vi.fn().mockRejectedValue(stale);
    await expect(importWithRetry(dead, [1, 1])).rejects.toBe(stale);
    expect(dead).toHaveBeenCalledTimes(3);
    const other = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(importWithRetry(other, [1, 1])).rejects.toThrow("boom");
    expect(other).toHaveBeenCalledTimes(1);
  });
});
