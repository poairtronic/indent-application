import { create } from 'zustand';

interface IndentState {
  viewMode: 'list' | 'grid';
  selectedIndentId: string | null;
  filters: {
    status?: string;
    departmentId?: string;
    search?: string;
    page: number;
    limit: number;
  };

  // Actions
  setViewMode: (mode: 'list' | 'grid') => void;
  setSelectedIndentId: (id: string | null) => void;
  setFilters: (filters: Partial<IndentState['filters']>) => void;
  resetFilters: () => void;
}

const initialFilters = {
  page: 1,
  limit: 10,
};

export const useIndentStore = create<IndentState>((set) => ({
  viewMode: 'list',
  selectedIndentId: null,
  filters: initialFilters,

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedIndentId: (id) => set({ selectedIndentId: id }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    })),

  resetFilters: () => set({ filters: initialFilters }),
}));
