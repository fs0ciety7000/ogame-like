import { create } from "zustand";
import { CHANGELOG_INDEX } from "virtual:changelog-index";
import { isNewcomer } from "@/game/announcements";
import { parisDay } from "@/game/retention";

/* =====================================================
   Journal des mises à jour : un fichier Markdown par version dans
   /changelog, nommé AAAA-MM-JJ-sujet.md, avec un en-tête :

     ---
     version: 1.4.0
     iteration: 5
     date: 2026-09-30
     title: Titre affiché
     ---
     Texte en Markdown (titres ##, listes -, **gras**, `code`).

   - iteration : numéro du lot livré, +1 à chaque mise à jour publiée.
   - date : jour du commit / de la PR qui livre la mise à jour (heure de
     Paris), jamais une date fictive.
     Le nom du fichier sert d'identifiant (pastille « non lu ») : ne pas
     renommer un fichier déjà publié, même si sa date change.
   - version : MAJEURE.MINEURE.CORRECTIF — mineure pour une mise à jour
     avec des nouveautés, correctif pour une livraison de corrections
     seules, majeure pour une refonte (nouvelle saison, remise à zéro…).

   - audience: equipe (facultatif, 6.14.161) : note technique (découpage du
     code, tailles de texte…) gardée dans le dépôt mais absente de la page
     Nouveautés des joueurs et de sa pastille.

   Les fichiers sont intégrés au build : ajouter un fichier suffit.
===================================================== */

export interface ChangelogEntry {
  id: string;
  version: string | null;
  iteration: number | null;
  date: string;
  title: string;
  /** Illustration facultative (chemin public, ex. /assets/story/varan.webp). */
  image: string | null;
  /** 6.14.161 (NJ-18) : note technique (`audience: equipe`), cachée aux joueurs. */
  team: boolean;
  body: string;
}

export function parseChangelogFile(id: string, raw: string): ChangelogEntry {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const iteration = Number.parseInt(meta.iteration ?? "", 10);
  return {
    id,
    version: meta.version || null,
    iteration: Number.isFinite(iteration) ? iteration : null,
    date: meta.date ?? id.slice(0, 10),
    title: meta.title ?? id,
    image: meta.image || null,
    team: meta.audience === "equipe",
    body: (match ? match[2] : raw).trim(),
  };
}

/** Version actuelle du jeu (celle de la dernière entrée du journal). Les
 *  textes complets sont dans changelogEntries.ts (page Nouveautés). */
export const CURRENT_VERSION = CHANGELOG_INDEX.find((e) => e.version)?.version ?? null;

/* ---------- lu / non lu (par appareil) ---------- */

const SEEN_KEY = "cosmic-empires:changelog-seen";

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export const useChangelogStore = create<{ seen: string }>(() => ({ seen: readSeen() }));

/** 6.14.161 (NJ-18) : jour d'inscription (Paris) ; les notes de ce jour et d'avant ne sont pas « nouvelles » pour le compte. */
export function changelogSince(createdAtMs: number | undefined): string {
  return createdAtMs ? parisDay(createdAtMs) : "";
}

/** Nombre d'entrées publiées depuis la dernière visite de la page Nouveautés. 6.14.161 (NJ-18) : aucune pour un compte
 *  neuf (`newcomerNews.quietHours`), ni pour les notes techniques ou antérieures à l'inscription. */
export function useUnreadChangelogCount(createdAtMs: number | undefined): number {
  const seen = useChangelogStore((s) => s.seen);
  if (isNewcomer(createdAtMs, Date.now())) return 0;
  return countUnread(seen, changelogSince(createdAtMs));
}

/** Entrées publiées après `seen` (id de la dernière entrée vue) et après le jour `since` (inscription, « » : sans limite).
 *  Une note technique n'est jamais « non lue ». */
export function isUnread(entryId: string, seen: string, since = ""): boolean {
  const entry = CHANGELOG_INDEX.find((e) => e.id === entryId);
  if (entry && (entry.team || (since && entry.date <= since))) return false;
  if (!seen) return true;
  const seenIndex = CHANGELOG_INDEX.findIndex((e) => e.id === seen);
  // Entrée vue inconnue (fichier renommé) : on retombe sur l'ordre des noms.
  if (seenIndex < 0) return entryId > seen;
  return CHANGELOG_INDEX.findIndex((e) => e.id === entryId) < seenIndex;
}

function countUnread(seen: string, since: string): number {
  return CHANGELOG_INDEX.filter((e) => isUnread(e.id, seen, since)).length;
}

export function markChangelogSeen() {
  const latest = CHANGELOG_INDEX[0]?.id ?? "";
  try {
    localStorage.setItem(SEEN_KEY, latest);
  } catch {
    /* navigation privée : la pastille reviendra au prochain chargement */
  }
  useChangelogStore.setState({ seen: latest });
}
