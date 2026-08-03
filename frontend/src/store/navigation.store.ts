import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  favorites: string[];
  recents: string[];
  toggleFavorite: (path: string) => void;
  addRecent: (path: string) => void;
  isFavorite: (path: string) => boolean;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recents: [],
      toggleFavorite: (path) => {
        const { favorites } = get();
        const next = favorites.includes(path)
          ? favorites.filter((p) => p !== path)
          : [...favorites, path];
        set({ favorites: next });
      },
      addRecent: (path) => {
        const { recents } = get();
        const filtered = recents.filter((p) => p !== path);
        const next = [path, ...filtered].slice(0, 5);
        set({ recents: next });
      },
      isFavorite: (path) => {
        return get().favorites.includes(path);
      },
    }),
    {
      name: 'navigation_settings',
    }
  )
);
