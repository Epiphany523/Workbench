// Voice panel store：畫布內浮動面板開合
import { create } from "zustand";

interface VoicePanelState {
    open: boolean;
    toggle: () => void;
    open_panel: () => void;
    close: () => void;
}

export const useVoicePanelStore = create<VoicePanelState>((set) => ({
    open: false,
    toggle: () => set((s) => ({ open: !s.open })),
    open_panel: () => set({ open: true }),
    close: () => set({ open: false }),
}));
