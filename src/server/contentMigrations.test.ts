import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultGameContent } from "@/game/content";
import { CLASS_UNITS, ELITE_UNITS, KESH_HUNTER_UNIT } from "@/game/units";
import { SYNTH_BUILDING_ID } from "@/game/buildings";

/* 6.14.60 (AU27, AJ27-3, constat AJ-5) : tout contenu par défaut (unité, bâtiment, techno, relique) ajouté après la
   première liste a son entrée `appendFromDefaults` dans CONTENT_MIGRATIONS (cosmic_db.js). Sans elle, il n'apparaît
   pas sur un serveur dont l'admin a enregistré la liste avant son arrivée (CLAUDE.md, « Nouveau bâtiment, unité… »).

   ORIGINE : identifiants présents dans les listes du code avant que l'admin puisse les enregistrer (figés ici, ne pas
   allonger). Un nouvel identifiant n'y entre pas : il reçoit une migration, ou il est « toujours présent » (ajouté par
   `withFixedUnits` / `withFixedBuildings`). */
const ORIGINE: Record<string, string[]> = {
  units: ["drone_recuperateur", "sonde_espionnage", "fregate", "cargo", "sentinelle", "chasseur", "etoile_noire", "croiseur_nova", "lance_gravitationnelle", "roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur"],
  buildings: ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees", "atelier_reparation", "hangar_attaque", "hangar_defense", "entrepot", "fonderie_quantique", "synthetiseur_neuronal", "generateur_bouclier"],
  technologies: ["tech1", "tech3", "tech9", "tech20", "tech2", "tech5", "tech4", "tech6", "tech11", "tech10", "tech14", "tech8", "tech7", "tech12", "tech17", "tech13", "tech15", "tech16", "tech18", "tech21", "tech22", "tech23", "tech24", "tech25", "tech19"],
  // Liste des reliques de la 5.9 (section éditable dans l'admin), mythiques de la 5.1 comprises.
  relics: ["engrenage_varan", "ecaille_leviathan", "noyau_forge", "codex_aube", "matrice_reparation", "soute_pliee", "oeil_vesper", "racine_ferraille", "cellule_stellaire", "essaim_nanites", "cristal_memoriel", "couronne_essaim", "egide_reine", "coeur_leviathan", "couronne_ambre", "oeil_neant", "egide_stellaire"],
};

/** Toujours présents, même dans une liste personnalisée (contenu.ts : withFixedUnits, withFixedBuildings). */
const TOUJOURS: Record<string, string[]> = {
  units: [KESH_HUNTER_UNIT.id, ...ELITE_UNITS.map((u) => u.id), ...CLASS_UNITS.map((u) => u.id)],
  buildings: [SYNTH_BUILDING_ID],
  technologies: [],
  relics: [],
};

/** Identifiants ajoutés par `appendFromDefaults`, par section (lecture du texte de cosmic_db.js). */
function migrated(): Record<string, string[]> {
  const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
  const start = db.indexOf("const CONTENT_MIGRATIONS = [");
  const end = db.indexOf("\n];", start);
  const block = db.slice(start, end);
  const out: Record<string, string[]> = {};
  const re = /appendFromDefaults:\s*\[([^\]]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const before = block.slice(0, m.index);
    const keys = [...before.matchAll(/key:\s*"(\w+)"/g)];
    const key = keys[keys.length - 1]?.[1] ?? "?";
    const ids = [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1]);
    out[key] = [...(out[key] ?? []), ...ids];
  }
  return out;
}

describe("AJ27-3 : migrations des contenus ajoutés après coup", () => {
  it("lit les entrées existantes (5.5, 5.21, 5.23, 5.28, 6.5)", () => {
    const mig = migrated();
    expect(mig.technologies).toEqual(expect.arrayContaining(["tech26", "tech27", "tech30"]));
    expect(mig.units).toEqual(expect.arrayContaining(["bastion", "recolteur"]));
    expect(mig.buildings).toEqual(["cale_seche"]);
    expect(mig.relics).toEqual(expect.arrayContaining(["cle_soudure", "sceau_sentinelle", "navette_mere"]));
  });

  it("chaque identifiant par défaut hors de la première liste a sa migration (ou est toujours présent)", () => {
    const mig = migrated();
    const content = defaultGameContent() as unknown as Record<string, { id: string }[]>;
    const missing: string[] = [];
    for (const section of Object.keys(ORIGINE)) {
      const ok = new Set([...ORIGINE[section], ...TOUJOURS[section], ...(mig[section] ?? [])]);
      for (const { id } of content[section]) if (!ok.has(id)) missing.push(`${section}:${id}`);
    }
    expect(missing).toEqual([]);
  });

  it("une migration ne vise qu'un identifiant qui existe dans le code", () => {
    const mig = migrated();
    const content = defaultGameContent() as unknown as Record<string, { id: string }[]>;
    const unknown: string[] = [];
    for (const [section, ids] of Object.entries(mig)) for (const id of ids) if (!content[section]?.some((x) => x.id === id)) unknown.push(`${section}:${id}`);
    expect(unknown).toEqual([]);
  });
});
