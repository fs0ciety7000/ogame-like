import { create } from "zustand";

/* v4.7.1 : apparitions du Léviathan déjà consultées (pastille du menu). */

const KEY = "cosmic-empires:leviathan-seen";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export const useLeviathanSeen = create<{ ids: string[] }>(() => ({ ids: read() }));

export function markLeviathanSeen(id: string | undefined) {
  if (!id || useLeviathanSeen.getState().ids.includes(id)) return;
  const ids = [...useLeviathanSeen.getState().ids, id].slice(-20);
  useLeviathanSeen.setState({ ids });
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* stockage indisponible */
  }
}
