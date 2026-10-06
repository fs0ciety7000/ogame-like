import { useEffect } from "react";
import { create } from "zustand";
import { sanitizeTemplate, TEMPLATE_RULES, type ActionStep, type ActionTemplate } from "@/game/actionTemplates";

/* 5.26 : modèles d'actions du Planificateur, par joueur et par appareil
   (comme les compositions de flotte). */

const key = (uid: string) => `cosmic-empires:action-templates:${uid}`;

function read(uid: string): ActionTemplate[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(uid)) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.map(sanitizeTemplate).filter((t): t is ActionTemplate => !!t) : [];
  } catch {
    return [];
  }
}

const useStore = create<{ byUid: Record<string, ActionTemplate[]> }>(() => ({ byUid: {} }));
const EMPTY: ActionTemplate[] = [];

export function useActionTemplates(uid: string | null | undefined): ActionTemplate[] {
  const stored = useStore((s) => (uid ? s.byUid[uid] : undefined));
  useEffect(() => {
    if (uid && stored === undefined) useStore.setState((s) => ({ byUid: { ...s.byUid, [uid]: read(uid) } }));
  }, [uid, stored]);
  return stored ?? EMPTY;
}

function set(uid: string, list: ActionTemplate[]) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(list));
  } catch {
    /* stockage indisponible : modèles gardés pour la session */
  }
  useStore.setState((s) => ({ byUid: { ...s.byUid, [uid]: list } }));
}

/** Crée ou remplace (même identifiant) un modèle. */
export function saveActionTemplate(uid: string, tpl: { id?: string; name: string; steps: ActionStep[] }): ActionTemplate {
  const list = useStore.getState().byUid[uid] ?? read(uid);
  const id = tpl.id ?? `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const clean = sanitizeTemplate({ id, name: tpl.name.trim() || "Modèle", steps: tpl.steps, updatedAtMs: Date.now() })!;
  const others = list.filter((t) => t.id !== id);
  if (!tpl.id && others.length >= TEMPLATE_RULES.maxTemplates) throw new Error(`${TEMPLATE_RULES.maxTemplates} modèles au plus : supprimes-en un d'abord.`);
  set(uid, [...others, clean].sort((a, b) => a.name.localeCompare(b.name)));
  return clean;
}

export function deleteActionTemplate(uid: string, id: string) {
  set(uid, (useStore.getState().byUid[uid] ?? read(uid)).filter((t) => t.id !== id));
}
