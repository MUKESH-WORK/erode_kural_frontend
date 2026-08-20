import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // ─── Navigation ───────────────────────
  currentModule: 'general',
  setCurrentModule: (module) => set({ currentModule: module }),

  // ─── Sidebar ──────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ─── Theme ────────────────────────────
  theme: localStorage.getItem('tn-theme') || 'light',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tn-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  // ─── Officer ──────────────────────────
  officerId: localStorage.getItem('tn-officer-id') || 'OFC001',
  setOfficerId: (id) => {
    localStorage.setItem('tn-officer-id', id);
    set({ officerId: id });
  },

  // ─── Inspector Panel ──────────────────
  inspectorOpen: false,
  inspectorData: null,
  openInspector: (data) => set({ inspectorOpen: true, inspectorData: data }),
  closeInspector: () => set({ inspectorOpen: false, inspectorData: null }),

  // ─── Bulk detail selected item ────────
  selectedSourceId: null,
  setSelectedSourceId: (id) => set({ selectedSourceId: id }),

  // ─── App config (from API) ────────────
  appConfig: null,
  setAppConfig: (config) => set({ appConfig: config }),

  // ─── Loading / Error states ───────────
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),
  error: null,
  setError: (e) => set({ error: e }),
}));

export default useAppStore;
