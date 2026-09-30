import { create } from "zustand";

/* =====================================================
   Journal des mises à jour : un fichier Markdown par version dans
   /changelog, nommé AAAA-MM-JJ-sujet.md, avec un en-tête :

     ---
     date: 2026-09-30
     title: Titre affiché
     ---
     Texte en Markdown (titres ##, listes -, **gras**, `code`).

   Les fichiers sont intégrés au build : ajouter un fichier suffit.
===================================================== */

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  body: string;
}

const files = import.meta.glob("/changelog/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

export function parseChangelogFile(id: string, raw: string): ChangelogEntry {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return {
    id,
    date: meta.date ?? id.slice(0, 10),
    title: meta.title ?? id,
    body: (match ? match[2] : raw).trim(),
  };
}

export const CHANGELOG: ChangelogEntry[] = Object.entries(files)
  .map(([path, raw]) => parseChangelogFile(path.split("/").pop()!.replace(/\.md$/, ""), raw))
  .sort((a, b) => b.id.localeCompare(a.id));

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

/** Nombre d'entrées publiées depuis la dernière visite de la page Nouveautés. */
export function useUnreadChangelogCount(): number {
  const seen = useChangelogStore((s) => s.seen);
  return CHANGELOG.filter((e) => e.id > seen).length;
}

export function markChangelogSeen() {
  const latest = CHANGELOG[0]?.id ?? "";
  try {
    localStorage.setItem(SEEN_KEY, latest);
  } catch {
    /* navigation privée : la pastille reviendra au prochain chargement */
  }
  useChangelogStore.setState({ seen: latest });
}
