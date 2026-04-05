// Character types
export interface StatValue {
  current: number;
  max: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
  region: string;
}

export interface Relationship {
  name: string;
  affection: number;
  trust: number;
  reputation: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest_item' | 'treasure';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  equipped: boolean;
  value: number;
}

export interface QuestProgress {
  quest_id: string;
  name: string;
  progress: number;
  stage: number;
}

export interface DeckCard {
  id: string;
  type: string;
  name: string;
  description: string;
  priority: number;
  is_urgent: boolean;
  occurrence_num: number;
}

export interface DeckState {
  cards: DeckCard[];
  current_index: number;
  cycle_count: number;
  is_shuffled: boolean;
}

export interface Character {
  id: string;
  player_id: string;
  name: string;
  background: string;
  traits: string[];
  alignment: string;
  level: number;
  xp: number;
  title: string;
  health: StatValue;
  spirit: StatValue;
  strength: number;
  intelligence: number;
  charisma: number;
  agility: number;
  current_region: string;
  position: Position;
  abilities: string[];
  discovered_locations: string[];
  known_factions: string[];
  lore_unlocked: string[];
  deck_state: DeckState;
  relationships: Record<string, Relationship>;
  inventory: InventoryItem[];
  gold: number;
  active_quests: QuestProgress[];
  completed_quests: string[];
  has_seen_intro: boolean;
  defense: number;
}

// Event types
export interface GameEvent {
  id: string;
  character_id: string;
  event_type: string;
  card_type: string;
  region: string;
  summary: string;
  dialogue: string;
  choices: EventChoice[];
  outcome: string;
  state_changes: Record<string, unknown>;
  timestamp: string;
}

export interface EventChoice {
  text: string;
  selected: boolean;
  outcome: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  character_id: string;
  npc_id: string;
  npc_name: string;
  sender: 'player' | 'npc';
  content: string;
  timestamp: string;
}

// Interaction types
export interface InteractResponse {
  card: DeckCard;
  content: EventContent;
  state_changes: Record<string, unknown>;
  character: Character;
}

export interface EventContent {
  type: string;
  summary: string;
  dialogue: string;
  scene: string;
  choices?: string[];
  item?: InventoryItem;
}

// Region types
export interface Region {
  id: string;
  name: string;
  description: string;
  danger_level: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
  points_of_interest: POI[];
}

export interface POI {
  id: string;
  name: string;
  description: string;
  position: Position;
  type: 'npc' | 'dungeon' | 'treasure' | 'landmark';
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
}
