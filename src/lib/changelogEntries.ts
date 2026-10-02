import { parseChangelogFile, type ChangelogEntry } from "@/lib/changelog";

/* Textes complets du journal : importés seulement par la page Nouveautés
   (chargée à la demande), pour ne pas alourdir le bundle commun. */

const files = import.meta.glob("/changelog/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export const CHANGELOG: ChangelogEntry[] = Object.entries(files)
  .map(([path, raw]) => parseChangelogFile(path.split("/").pop()!.replace(/\.md$/, ""), raw))
  // Plus récente d'abord : par itération, puis par nom de fichier.
  .sort((a, b) => (b.iteration ?? 0) - (a.iteration ?? 0) || b.id.localeCompare(a.id));
