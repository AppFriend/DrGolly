import { create } from "zustand";

interface UpgradeModalStore {
  isOpen: boolean;
  feature?: string;
  openUpgradeModal: (feature?: string) => void;
  closeUpgradeModal: () => void;
}

export const useUpgradeModal = create<UpgradeModalStore>((set) => ({
  isOpen: false,
  feature: undefined,
  openUpgradeModal: (feature?: string) => set({ isOpen: true, feature }),
  closeUpgradeModal: () => set({ isOpen: false, feature: undefined }),
}));