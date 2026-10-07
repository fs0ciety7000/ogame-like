import { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";

/* 6.14.42 : documents en direct (collection `live_docs`, admins seulement). Claude y envoie les fichiers de travail
   (QUESTIONS.md, conseils, index des fiches, propositions et feuilles de route, liste des illustrations) avec
   `node scripts/live-docs.mjs push`, sans commit ni redéploiement. Les pages /decisions et /img lisent la version en direct
   quand elle existe, sinon celle du build. */

export const LIVE_DOCS = "live_docs";

export interface LiveDocs {
  /** Contenu par chemin du dépôt (« docs/QUESTIONS.md »). */
  docs: Record<string, string>;
  /** Date de l'envoi le plus récent (ms), 0 si rien en direct. */
  updatedAtMs: number;
  loaded: boolean;
}

/** Documents en direct dont le chemin commence par un des préfixes (lecture réservée aux admins). */
export function useLiveDocs(prefixes: string[], enabled = true): LiveDocs {
  const [state, setState] = useState<LiveDocs>({ docs: {}, updatedAtMs: 0, loaded: false });
  const key = prefixes.join("|");
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const filter = key
      .split("|")
      .map((p) => pb.filter("path ~ {:p}", { p: `${p}%` }))
      .join(" || ");
    pb.collection(LIVE_DOCS)
      .getFullList({ filter, batch: 500, fields: "path,content,updatedAtMs" })
      .then((list) => {
        if (!alive) return;
        const docs: Record<string, string> = {};
        let updatedAtMs = 0;
        for (const r of list) {
          docs[String(r.path)] = String(r.content ?? "");
          updatedAtMs = Math.max(updatedAtMs, Number(r.updatedAtMs) || 0);
        }
        setState({ docs, updatedAtMs, loaded: true });
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, loaded: true }));
      });
    return () => {
      alive = false;
    };
  }, [key, enabled]);
  return state;
}

/** Fusion : version en direct si elle existe, sinon celle du build. */
export function withLive(build: Record<string, string>, live: Record<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = { ...build };
  for (const [path, content] of Object.entries(live)) if (path.startsWith(prefix)) out[path] = content;
  return out;
}
