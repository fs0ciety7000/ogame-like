/** Chance que la cible soit notifiée d'une tentative d'espionnage. */
export const SPY_DETECTION_CHANCE = 0.25;

/** `random` est injectable pour des tests déterministes (sinon Math.random). */
export function rollSpyDetection(random: () => number = Math.random): boolean {
  return random() < SPY_DETECTION_CHANCE;
}
