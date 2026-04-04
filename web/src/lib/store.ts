import { create } from 'zustand';
import { Character, GameEvent, ChatMessage, InteractResponse } from '@/types';

interface GameState {
  // User state
  token: string | null;
  user: { id: string; username: string } | null;
  
  // Character state
  character: Character | null;
  
  // Game state
  events: GameEvent[];
  chatMessages: ChatMessage[];
  currentEvent: InteractResponse | null;
  isLoading: boolean;
  
  // UI state
  activeTab: 'main' | 'inventory' | 'quests' | 'map' | 'social';
  showDialog: boolean;
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: { id: string; username: string } | null) => void;
  setCharacter: (character: Character | null) => void;
  setEvents: (events: GameEvent[]) => void;
  addEvent: (event: GameEvent) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setCurrentEvent: (event: InteractResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: 'main' | 'inventory' | 'quests' | 'map' | 'social') => void;
  setShowDialog: (show: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  token: null,
  user: null,
  character: null,
  events: [],
  chatMessages: [],
  currentEvent: null,
  isLoading: false,
  activeTab: 'main',
  showDialog: false,

  // Actions
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setCharacter: (character) => set({ character }),
  
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  
  setCurrentEvent: (event) => set({ currentEvent: event, showDialog: !!event }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowDialog: (show) => set({ showDialog: show }),
  
  updateCharacter: (updates) => set((state) => ({
    character: state.character ? { ...state.character, ...updates } : null,
  })),
}));

// Computed selectors
export const selectHealthPercent = (state: GameState) => {
  if (!state.character) return 0;
  return (state.character.health.current / state.character.health.max) * 100;
};

export const selectSpiritPercent = (state: GameState) => {
  if (!state.character) return 0;
  return (state.character.spirit.current / state.character.spirit.max) * 100;
};

export const selectXPProgress = (state: GameState) => {
  if (!state.character) return 0;
  return (state.character.xp / (state.character.level * 100)) * 100;
};
