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
