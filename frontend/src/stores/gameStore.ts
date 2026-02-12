import { create } from 'zustand';
import type { GameState, GameEvent, Nation } from '../types/game';

export type Screen = 'setup' | 'game';
export type SidePanel = 'info' | 'actions' | 'chat' | 'advisor';

interface GameStore {
  // Navigation
  screen: Screen;
  setScreen: (s: Screen) => void;

  // Game state
  gameState: GameState | null;
  setGameState: (gs: GameState) => void;

  // UI state
  sidePanel: SidePanel;
  setSidePanel: (p: SidePanel) => void;
  selectedNationId: string | null;
  setSelectedNationId: (id: string | null) => void;
  chatTargetNationId: string | null;
  setChatTargetNationId: (id: string | null) => void;

  // Events display
  pendingEvents: GameEvent[];
  setPendingEvents: (events: GameEvent[]) => void;
  showEventModal: boolean;
  setShowEventModal: (show: boolean) => void;
  currentEventIndex: number;
  setCurrentEventIndex: (i: number) => void;

  // Loading
  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;

  // World narrative
  worldNarrative: string;
  setWorldNarrative: (n: string) => void;

  // Helper: get player nation
  getPlayerNation: () => Nation | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'setup',
  setScreen: (s) => set({ screen: s }),

  gameState: null,
  setGameState: (gs) => set({ gameState: gs }),

  sidePanel: 'info',
  setSidePanel: (p) => set({ sidePanel: p }),
  selectedNationId: null,
  setSelectedNationId: (id) => set({ selectedNationId: id }),
  chatTargetNationId: null,
  setChatTargetNationId: (id) => set({ chatTargetNationId: id }),

  pendingEvents: [],
  setPendingEvents: (events) => set({ pendingEvents: events }),
  showEventModal: false,
  setShowEventModal: (show) => set({ showEventModal: show }),
  currentEventIndex: 0,
  setCurrentEventIndex: (i) => set({ currentEventIndex: i }),

  isSimulating: false,
  setIsSimulating: (v) => set({ isSimulating: v }),
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),

  worldNarrative: '',
  setWorldNarrative: (n) => set({ worldNarrative: n }),

  getPlayerNation: () => {
    const gs = get().gameState;
    if (!gs) return null;
    return gs.nations[gs.player_nation_id] || null;
  },
}));
