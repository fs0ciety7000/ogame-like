import { useSfxStore } from "@/store/sfxStore";

/** Petits bips synthétisés à la volée (Web Audio API) plutôt que des
 *  fichiers audio : zéro asset à charger, cohérent avec le thème HUD. */
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
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.07) {
  if (!useSfxStore.getState().enabled) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playConfirm() {
  beep(880, 0.08);
}

export function playAlert() {
  beep(220, 0.18, "sawtooth", 0.06);
}

export function playUnlock() {
  beep(660, 0.1);
  setTimeout(() => beep(990, 0.14), 90);
}

export function playClick() {
  beep(1200, 0.03, "sine", 0.04);
}

export function playWarp() {
  if (!useSfxStore.getState().enabled) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.55);
}
