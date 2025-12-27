import { create } from 'zustand';

export type AppView = 'accounts' | 'generators';

interface AppNavigationState {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const useAppNavigation = create<AppNavigationState>((set) => ({
  currentView: 'accounts',
  setView: (view) => set({ currentView: view }),
}));
