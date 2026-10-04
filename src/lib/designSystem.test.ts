import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* Design system (docs/DESIGN.md) : les pastilles et encadrés passent par
   HudChip / HudCallout (coins coupés, capitales mono, ton sémantique).
   Garde-fou contre les pilules arrondies écrites à la main. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : name.endsWith(".tsx") ? [path] : [];
  });
}

describe("design system", () => {
  it("aucune pastille ni encadré arrondi écrit à la main", () => {
    const offenders: string[] = [];
    for (const file of files("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          // Bordure + arrondi lg/md/xl : pastille (px/py) ou encadré (p-*) hors primitives.
          if (/rounded-(?:md|lg|xl)\b[^"`]*\bborder\b(?!-)[^"`]*\b(?:px-|p-)\d/.test(line) || /\bborder\b(?!-)[^"`]*rounded-(?:md|lg|xl)\b[^"`]*\b(?:px-|p-)\d/.test(line)) {
            offenders.push(`${file}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("aucune couleur hex écrite dans un composant (jetons du thème)", () => {
    // Scènes dessinées (planète, boss, nébuleuse, étoiles, vue cockpit), rapport imprimé,
    // logo Google et aperçu d'e-mail : couleurs d'illustration ou de marque, hors thème.
    const allowed = /(HomePlanet|BossStage|Nebula|ParallaxStars|CockpitViewport|StatsPrintReport|AltSignIn|MailPanel)\.tsx$/;
    const offenders: string[] = [];
    for (const file of files("src")) {
      if (allowed.test(file) || file.includes(".test.")) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?=["'`;,) \]])/.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
