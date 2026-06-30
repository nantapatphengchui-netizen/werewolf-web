import { create } from 'zustand';

interface AudioPhaseStore {
  phase: string;
  setPhase: (phase: string) => void;
}

export const useAudioPhaseStore = create<AudioPhaseStore>((set) => ({
  phase: 'lobby',
  setPhase: (phase) => set({ phase }),
}));
