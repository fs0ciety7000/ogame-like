/* Formatage des nombres « à la française » sans Intl ni toLocaleString :
 * le moteur JavaScript des hooks PocketBase (goja) ne les gère pas, et ce
 * code est partagé entre le navigateur et le serveur. */

/** 1234567 → « 1 234 567 » (espace fine insécable). */
export function formatInt(value: number): string {
  const n = Math.round(Number(value) || 0);
  const digits = String(Math.abs(n));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += " ";
    out += digits[i];
  }
  return n < 0 ? `-${out}` : out;
}

/** 64.577 → « 64,58 » (au plus `maxDigits` décimales, zéros inutiles retirés). */
export function formatDecimal(value: number, maxDigits: number): string {
  const fixed = (Number(value) || 0).toFixed(maxDigits);
  const [intPart, frac = ""] = fixed.split(".");
  const trimmed = frac.replace(/0+$/, "");
  return formatInt(Number(intPart)) + (trimmed ? `,${trimmed}` : "");
}

/** v5.1 : montants par ressource, « 1 200 ferraille, 300 énergie » (« rien » si vide). */
export function describeGain(gain: Partial<Record<string, number>>): string {
  const names: Record<string, string> = { scrap: "ferraille", energy: "énergie", nano: "nanocomposants", data: "données", reinforcedSteel: "acier renforcé", cyberModule: "modules", syntheticNanites: "nanites", aiFragment: "fragments d'IA" };
  const parts = Object.entries(gain)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${formatInt(v ?? 0)} ${names[k] ?? k}`);
  return parts.length ? parts.join(", ") : "rien";
}

/** 1 234 567 → « 1,2 M » (même rendu que formatCompact, sans Intl). */
export function formatShort(value: number): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const units: [number, string][] = [[1e12, " Bn"], [1e9, " Md"], [1e6, " M"], [1e3, " k"]];
  for (const [size, suffix] of units) if (abs >= size) return `${formatDecimal(n / size, 1)}${suffix}`;
  return formatDecimal(n, 1);
}
