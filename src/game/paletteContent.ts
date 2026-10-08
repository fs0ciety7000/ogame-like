/* =====================================================
   6.14.130 (AU27, lot AJ27-8, constat AJ-9) : contenus que la recherche
   Ctrl+K (`CommandPalette.tsx`) sait trouver, en plus des unités,
   bâtiments et technologies : reliques, boss (mondiaux, d'alliance, de
   chronique), colonies (biomes, spécialisations), talents, modules,
   classes d'empire et officiers. Une entrée par contenu du registre en
   vigueur (un contenu ajouté dans l'admin y entre sans autre code), avec
   la page où l'on s'en sert. Lu aussi par la garde de la chaîne de contenu
   (`contentChain.ts`, maillon « Recherche Ctrl+K »). Moteur pur.
===================================================== */
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import { chroniclesConfig } from "@/game/chronicles";
import { BIOMES, COLONY_SPECS, RARE_DEPOSITS } from "@/game/colonies";
import { allCommanders } from "@/game/commanders";
import { empireClasses } from "@/game/empireClass";
import { MODULE_TEMPLATES } from "@/game/modules";
import { RELICS, relicImage } from "@/game/relics";
import { TALENTS } from "@/game/talents";
import { WORLD_BOSSES } from "@/game/worldBosses";

export type PaletteContentKind = "relic" | "worldBoss" | "allianceBoss" | "seasonBoss" | "colony" | "talent" | "module" | "class" | "officer";

export interface PaletteContentEntry {
  kind: PaletteContentKind;
  id: string;
  label: string;
  /** Type affiché sous le nom (« Relique », « Boss mondial »…). */
  sublabel: string;
  /** Page où l'on s'en sert. */
  to: string;
  image?: string;
  /** Mots cherchés en plus du nom (identifiant, titre d'officier, chapitre). */
  keywords?: string;
}

/** Libellé de chaque type (sous-titre de la palette). */
export const PALETTE_CONTENT_LABELS: Record<PaletteContentKind, string> = {
  relic: "Relique",
  worldBoss: "Boss mondial",
  allianceBoss: "Boss d'alliance",
  seasonBoss: "Boss de chronique",
  colony: "Colonie",
  talent: "Talent d'Ascension",
  module: "Module de vaisseau",
  class: "Classe d'empire",
  officer: "Officier",
};

/** Mois « AAAA-MM » (UTC) d'un instant. */
function monthOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Contenus trouvables par Ctrl+K. `nowMs` : un boss de chronique n'apparaît qu'une fois son mois commencé (pas de chapitre
 * à venir dévoilé). Talents et modules retirés restent cherchables (les joueurs qui les ont les gardent).
 */
export function paletteContentEntries(nowMs: number): PaletteContentEntry[] {
  const L = PALETTE_CONTENT_LABELS;
  const out: PaletteContentEntry[] = [];
  for (const r of RELICS) if (!r.disabled) out.push({ kind: "relic", id: r.id, label: r.name, sublabel: L.relic, to: "/game/etat-major?onglet=relics", image: r.image || relicImage(r.id) });
  for (const b of WORLD_BOSSES) if (b.enabled !== false) out.push({ kind: "worldBoss", id: b.id, label: b.name, sublabel: L.worldBoss, to: "/game/uber", image: b.image });
  for (const b of ALLIANCE_BOSSES) out.push({ kind: "allianceBoss", id: b.id, label: b.name, sublabel: L.allianceBoss, to: "/game/alliance?onglet=boss", image: b.image });
  const month = monthOf(nowMs);
  for (const m of chroniclesConfig().months) {
    if (m.id > month || !m.boss?.name) continue;
    out.push({ kind: "seasonBoss", id: m.id, label: m.boss.name, sublabel: `${L.seasonBoss} · ${m.title}`, to: "/game/boss", keywords: m.title });
  }
  for (const b of RARE_DEPOSITS) out.push({ kind: "colony", id: b, label: BIOMES[b].name, sublabel: `${L.colony} · biome`, to: "/game/colonies", keywords: BIOMES[b].deposit });
  for (const s of COLONY_SPECS) out.push({ kind: "colony", id: s.id, label: s.name, sublabel: `${L.colony} · spécialisation`, to: "/game/colonies" });
  for (const t of TALENTS) out.push({ kind: "talent", id: t.id, label: t.name, sublabel: L.talent, to: "/game/ascension" });
  for (const m of MODULE_TEMPLATES) out.push({ kind: "module", id: m.id, label: m.name, sublabel: L.module, to: "/game/etat-major?onglet=modules" });
  for (const c of empireClasses()) out.push({ kind: "class", id: c.id, label: c.name, sublabel: L.class, to: "/game/classe" });
  for (const c of allCommanders()) out.push({ kind: "officer", id: c.id, label: c.name, sublabel: c.title ? `${L.officer} · ${c.title}` : L.officer, to: "/game/etat-major?onglet=commanders", image: c.portrait, keywords: c.title });
  return out;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Entrées dont le nom (ou les mots cherchés) contient la recherche, au moins 2 lettres, accents ignorés ; `max` par type. */
export function matchPaletteContent(query: string, nowMs: number, max = 3): PaletteContentEntry[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const seen = new Map<PaletteContentKind, number>();
  const out: PaletteContentEntry[] = [];
  for (const e of paletteContentEntries(nowMs)) {
    if (!fold(`${e.label} ${e.keywords ?? ""}`).includes(q)) continue;
    const n = seen.get(e.kind) ?? 0;
    if (n >= max) continue;
    seen.set(e.kind, n + 1);
    out.push(e);
  }
  return out;
}
