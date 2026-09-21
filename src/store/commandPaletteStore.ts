import { create } from "zustand";

interface CommandPaletteState {
  open: boolean;
}

export const useCommandPaletteStore = create<CommandPaletteState>(() => ({ open: false }));

export function openCommandPalette() {
  useCommandPaletteStore.setState({ open: true });
}

export function closeCommandPalette() {
  useCommandPaletteStore.setState({ open: false });
}

export function toggleCommandPalette() {
  useCommandPaletteStore.setState((s) => ({ open: !s.open }));
}
