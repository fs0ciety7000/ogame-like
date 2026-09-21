import { create } from "zustand";
import type { AwaySummary } from "@/services/playerService";

interface AwaySummaryState {
  current: AwaySummary | null;
}

export const useAwaySummaryStore = create<AwaySummaryState>(() => ({ current: null }));

export function showAwaySummary(summary: AwaySummary) {
  useAwaySummaryStore.setState({ current: summary });
}

export function closeAwaySummary() {
  useAwaySummaryStore.setState({ current: null });
}
