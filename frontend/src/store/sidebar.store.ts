import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: true,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
}));
