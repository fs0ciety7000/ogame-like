import { sfxVolume, type SfxCategory } from "@/store/sfxStore";
import type { ThemeId } from "@/lib/theme";

/** Sons synthétisés à la volée (Web Audio API) plutôt que des fichiers
 *  audio : zéro asset à charger, cohérent avec le thème HUD.
 *  v4.4 : une catégorie par son (volume réglable), plus de variété
 *  (victoire, défaite, palier…) et une ambiance continue par thème. */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

interface Tone {
  freq: number;
  /** Fréquence d'arrivée (glissando), facultative. */
  to?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  /** Départ, en secondes après le début du son. */
  at?: number;
}

function play(category: SfxCategory, tones: Tone[]) {
  // v5.14.2 : un son ne doit jamais casser une action (contexte audio fermé ou
  // refusé sur certains téléphones : le casino restait bloqué en « tirage »).
  try {
    playTones(category, tones);
  } catch {
    /* pas de son, tant pis */
  }
}

function playTones(category: SfxCategory, tones: Tone[]) {
  const master = sfxVolume(category);
  if (master <= 0) return;
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + 0.01;
  for (const t of tones) {
    const start = t0 + (t.at ?? 0);
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = t.type ?? "sine";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.duration);
    const peak = Math.max(0.0002, (t.volume ?? 0.07) * master);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.015, t.duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + t.duration + 0.02);
  }
}

/* ---------- interface ---------- */

export function playClick() {
  play("ui", [{ freq: 1200, duration: 0.03, volume: 0.04 }]);
}

export function playConfirm() {
  play("ui", [{ freq: 880, duration: 0.08 }]);
}

/* ---------- v5.12 : Casino orbital ---------- */

/** Levier tiré : cliquetis montant. */
export function playSlotPull() {
  play("casino", Array.from({ length: 6 }, (_, i) => ({ freq: 300 + i * 90, duration: 0.04, type: "square" as OscillatorType, volume: 0.03, at: i * 0.05 })));
}

/** Arrêt d'un rouleau. */
export function playSlotStop(index: number) {
  play("casino", [{ freq: 180 + index * 40, to: 120, duration: 0.09, type: "triangle", volume: 0.08 }]);
}

/** Petit gain. */
export function playSlotWin() {
  play("casino", [
    { freq: 784, duration: 0.09, type: "triangle", volume: 0.07 },
    { freq: 988, duration: 0.09, type: "triangle", volume: 0.07, at: 0.08 },
    { freq: 1319, duration: 0.2, type: "triangle", volume: 0.07, at: 0.16 },
  ]);
}

/** Gros lot : fanfare et pluie de pièces. */
export function playJackpot() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  play("casino", [
    ...notes.map((f, i) => ({ freq: f, duration: 0.16, type: "triangle" as OscillatorType, volume: 0.09, at: i * 0.11 })),
    ...Array.from({ length: 14 }, (_, i) => ({ freq: 1800 + (i % 4) * 220, duration: 0.05, type: "sine" as OscillatorType, volume: 0.03, at: 0.8 + i * 0.07 })),
  ]);
}

/* ---------- évènements ---------- */

export function playBuildDone() {
  play("events", [
    { freq: 523, duration: 0.12, type: "triangle", volume: 0.07 },
    { freq: 659, duration: 0.12, type: "triangle", volume: 0.07, at: 0.08 },
    { freq: 784, duration: 0.22, type: "triangle", volume: 0.07, at: 0.16 },
  ]);
}

export function playUnlock() {
  play("events", [
    { freq: 660, duration: 0.1 },
    { freq: 990, duration: 0.14, at: 0.09 },
  ]);
}

export function playVictory() {
  play("combat", [
    { freq: 392, duration: 0.14, type: "triangle", volume: 0.08 },
    { freq: 523, duration: 0.14, type: "triangle", volume: 0.08, at: 0.12 },
    { freq: 659, duration: 0.14, type: "triangle", volume: 0.08, at: 0.24 },
    { freq: 784, duration: 0.5, type: "triangle", volume: 0.09, at: 0.36 },
    { freq: 523, duration: 0.5, volume: 0.04, at: 0.36 },
    { freq: 1047, duration: 0.45, volume: 0.03, at: 0.4 },
  ]);
}

export function playDefeat() {
  play("combat", [
    { freq: 392, duration: 0.2, type: "triangle", volume: 0.07 },
    { freq: 330, duration: 0.2, type: "triangle", volume: 0.07, at: 0.18 },
    { freq: 262, duration: 0.6, type: "triangle", volume: 0.07, to: 220, at: 0.36 },
  ]);
}

/** Passage de palier d'un bâtiment : balayage montant puis accord. */
export function playTier() {
  play("events", [
    { freq: 220, to: 1760, duration: 0.9, type: "sawtooth", volume: 0.025 },
    { freq: 523, duration: 1.1, type: "triangle", volume: 0.06, at: 0.8 },
    { freq: 659, duration: 1.1, type: "triangle", volume: 0.05, at: 0.84 },
    { freq: 784, duration: 1.1, type: "triangle", volume: 0.05, at: 0.88 },
    { freq: 1568, duration: 0.8, volume: 0.02, at: 0.95 },
  ]);
}

export function playWarp() {
  play("events", [{ freq: 180, to: 900, duration: 0.55, type: "sawtooth", volume: 0.05 }]);
}

export function playMessage() {
  play("notifications", [
    { freq: 988, duration: 0.07, volume: 0.05 },
    { freq: 1319, duration: 0.1, volume: 0.05, at: 0.07 },
  ]);
}

/* ---------- alertes ---------- */

export function playAlert() {
  play("alerts", [{ freq: 220, duration: 0.18, type: "sawtooth", volume: 0.06 }]);
}

/** Flotte hostile en approche : deux sirènes. */
export function playAttackAlert() {
  play("alerts", [
    { freq: 330, to: 660, duration: 0.3, type: "sawtooth", volume: 0.045 },
    { freq: 330, to: 660, duration: 0.3, type: "sawtooth", volume: 0.045, at: 0.36 },
  ]);
}

export function playSpyAlert() {
  play("alerts", [
    { freq: 1760, duration: 0.05, type: "square", volume: 0.025 },
    { freq: 1760, duration: 0.05, type: "square", volume: 0.025, at: 0.1 },
    { freq: 1175, duration: 0.12, type: "square", volume: 0.025, at: 0.2 },
  ]);
}

/** Échantillons pour la page Réglages. */
export const SFX_SAMPLES: Record<SfxCategory, () => void> = {
  ui: playConfirm,
  events: playBuildDone,
  combat: playVictory,
  casino: playSlotWin,
  notifications: playMessage,
  alerts: playAttackAlert,
  ambience: () => undefined,
};

/* ---------- ambiance par thème ---------- */

interface AmbienceGraph {
  theme: ThemeId;
  out: GainNode;
  stop: () => void;
}

let ambience: AmbienceGraph | null = null;

/** Accords de base (Hz) et couleur de chaque thème. */
const AMBIENCE: Record<ThemeId, { notes: number[]; type: OscillatorType; cutoff: number; lfo: number }> = {
  tactique: { notes: [55, 82.4, 110], type: "sawtooth", cutoff: 320, lfo: 0.07 },
  holo: { notes: [110, 164.8, 220, 329.6], type: "sine", cutoff: 1400, lfo: 0.11 },
  cockpit: { notes: [41.2, 61.7, 82.4], type: "square", cutoff: 220, lfo: 0.05 },
  netrunner: { notes: [73.4, 110, 146.8, 174.6], type: "triangle", cutoff: 900, lfo: 0.16 },
  // Aurora : accord majeur 7e, doux et chaud (Ré, Fa#, La, Do#).
  aurora: { notes: [73.4, 92.5, 110, 138.6], type: "sine", cutoff: 1100, lfo: 0.09 },
  // Signal : quintes à vide, sèches et graphiques (La, Mi, La).
  signal: { notes: [55, 82.4, 110, 164.8], type: "triangle", cutoff: 650, lfo: 0.04 },
  // Voyageur : nappe éthérée et lente (Mi, Si, Mi, Sol#).
  voyageur: { notes: [82.4, 123.5, 164.8, 207.7], type: "sine", cutoff: 1600, lfo: 0.05 },
  // Omni : synthé analogique chaud et ample (Do, Sol, Do, Mib).
  omni: { notes: [65.4, 98, 130.8, 155.6], type: "sawtooth", cutoff: 520, lfo: 0.08 },
  // Spartan : chœur grave et solennel (Ré, La, Ré, Fa).
  spartan: { notes: [36.7, 55, 73.4, 87.3], type: "triangle", cutoff: 480, lfo: 0.06 },
  // Constellation : accord ouvert, contemplatif (Sol, Ré, Sol, Si).
  constellation: { notes: [49, 73.4, 98, 123.5], type: "sine", cutoff: 900, lfo: 0.03 },
};

function buildAmbience(audio: AudioContext, theme: ThemeId): AmbienceGraph {
  const def = AMBIENCE[theme] ?? AMBIENCE.tactique;
  const out = audio.createGain();
  out.gain.value = 0.0001;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = def.cutoff;
  filter.Q.value = 2;
  filter.connect(out);
  out.connect(audio.destination);
  // Respiration lente du filtre.
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.frequency.value = def.lfo;
  lfoGain.gain.value = def.cutoff * 0.45;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  const oscs = def.notes.flatMap((f, i) =>
    [-4, 4].map((detune) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = def.type;
      o.frequency.value = f;
      o.detune.value = detune + i;
      g.gain.value = 0.05 / def.notes.length;
      o.connect(g);
      g.connect(filter);
      o.start();
      return o;
    }),
  );
  return {
    theme,
    out,
    stop: () => {
      const t = audio.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      setTimeout(() => {
        [...oscs, lfo].forEach((o) => o.stop());
        out.disconnect();
      }, 900);
    },
  };
}

/** Démarre, ajuste ou coupe l'ambiance selon le thème et le volume. Le
 *  navigateur n'autorise le son qu'après une interaction : à appeler sur
 *  un clic ou quand le volume change. */
export function updateAmbience(theme: ThemeId) {
  const volume = sfxVolume("ambience");
  if (volume <= 0) {
    ambience?.stop();
    ambience = null;
    return;
  }
  const audio = getCtx();
  if (!audio) return;
  if (audio.state !== "running") {
    // Sans interaction préalable, le navigateur laisse le contexte suspendu.
    void audio.resume().catch(() => undefined).then(() => {
      if (audio.state === "running") updateAmbience(theme);
    });
    return;
  }
  if (ambience && ambience.theme !== theme) {
    ambience.stop();
    ambience = null;
  }
  if (!ambience) ambience = buildAmbience(audio, theme);
  const t = audio.currentTime;
  ambience.out.gain.cancelScheduledValues(t);
  ambience.out.gain.setValueAtTime(Math.max(0.0001, ambience.out.gain.value), t);
  ambience.out.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.9), t + 1.5);
}

export function ambienceRunning(): boolean {
  return ambience !== null;
}
