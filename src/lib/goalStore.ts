import { useEffect } from "react";
import { create } from "zustand";
import { GOAL_RULES, sanitizeGoal, type Goal } from "@/game/goals";

/* 5.26 : objectifs personnels, par joueur et par appareil. */

const key = (uid: string) => `cosmic-empires:goals:${uid}`;

function read(uid: string): Goal[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(uid)) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.map(sanitizeGoal).filter((g): g is Goal => !!g) : [];
  } catch {
    return [];
  }
}

const useStore = create<{ byUid: Record<string, Goal[]> }>(() => ({ byUid: {} }));
const EMPTY: Goal[] = [];

export function useGoals(uid: string | null | undefined): Goal[] {
  const stored = useStore((s) => (uid ? s.byUid[uid] : undefined));
  useEffect(() => {
    if (uid && stored === undefined) useStore.setState((s) => ({ byUid: { ...s.byUid, [uid]: read(uid) } }));
  }, [uid, stored]);
  return stored ?? EMPTY;
}

function set(uid: string, list: Goal[]) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(list));
  } catch {
    /* stockage indisponible : objectifs gardés pour la session */
  }
  useStore.setState((s) => ({ byUid: { ...s.byUid, [uid]: list } }));
}

export function addGoal(uid: string, goal: Omit<Goal, "id" | "createdAtMs">) {
  const list = useStore.getState().byUid[uid] ?? read(uid);
  if (list.length >= GOAL_RULES.maxGoals) throw new Error(`${GOAL_RULES.maxGoals} objectifs au plus : retires-en un d'abord.`);
  const clean = sanitizeGoal({ ...goal, id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAtMs: Date.now() });
  if (!clean) throw new Error("Objectif invalide.");
  set(uid, [...list, clean]);
}

export function removeGoal(uid: string, id: string) {
  set(uid, (useStore.getState().byUid[uid] ?? read(uid)).filter((g) => g.id !== id));
}
