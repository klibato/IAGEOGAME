export type Difficulty = 'very_easy' | 'easy' | 'normal' | 'hard' | 'impossible';

export type RelationType = 'allied' | 'friendly' | 'neutral' | 'tense' | 'hostile' | 'at_war';

export type BattalionType = 'infantry' | 'armor' | 'naval' | 'air';
export type BattalionStatus = 'deployed' | 'moving' | 'engaged' | 'reserve';
export type EventCategory = 'military' | 'diplomatic' | 'economic' | 'internal' | 'global';

export interface Battalion {
  id: string;
  name: string;
  nation_id: string;
  type: BattalionType;
  strength: number;
  region_id: string;
  lat: number;
  lng: number;
  status: BattalionStatus;
}

export interface Region {
  id: string;
  name: string;
  controlled_by: string;
  geojson_feature_id: string;
  population: number;
  terrain_type: string;
  strategic_value: number;
  resources: string[];
  has_capital: boolean;
  battalions_present: string[];
}

export interface Nation {
  id: string;
  name: string;
  color: string;
  flag_url: string | null;
  leader: string;
  government_type: string;
  description: string;
  regions_controlled: string[];
  military_strength: number;
  economic_strength: number;
  stability: number;
  population: number;
  battalions: Battalion[];
  tags: string[];
  is_player: boolean;
}

export interface MapChange {
  type: string;
  region_id?: string;
  from_nation?: string;
  to_nation?: string;
  battalion_id?: string;
  nation_id?: string;
  name?: string;
  battalion_type?: string;
  strength?: number;
  new_region_id?: string;
  new_lat?: number;
  new_lng?: number;
  lat?: number;
  lng?: number;
}

export interface StatChange {
  nation_id: string;
  military?: number;
  economy?: number;
  stability?: number;
}

export interface RelationChange {
  nation_a: string;
  nation_b: string;
  new_relation: RelationType;
}

export interface GameEvent {
  id: string;
  turn_number: number;
  date: string;
  title: string;
  description: string;
  category: EventCategory;
  nations_involved: string[];
  map_changes: MapChange[];
  stat_changes: StatChange[];
  relation_changes: RelationChange[];
}

export interface War {
  id: string;
  name: string;
  attackers: string[];
  defenders: string[];
  start_date: string;
}

export interface Alliance {
  id: string;
  name: string;
  members: string[];
  start_date: string;
}

export interface Treaty {
  id: string;
  name: string;
  signatories: string[];
  terms: string;
  start_date: string;
}

export interface PlayerAction {
  id: string;
  text: string;
  submitted_at_turn: number;
}

export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
}

export interface GameState {
  game_id: string;
  preset_id: string;
  current_date: string;
  start_date: string;
  turn_number: number;
  difficulty: Difficulty;
  player_nation_id: string;
  nations: Record<string, Nation>;
  regions: Record<string, Region>;
  events_log: GameEvent[];
  consolidated_summary: string;
  diplomatic_relations: Record<string, Record<string, RelationType>>;
  active_wars: War[];
  active_alliances: Alliance[];
  active_treaties: Treaty[];
  world_before: string;
  simulation_rules: string;
  pending_actions: PlayerAction[];
  chat_histories: Record<string, ChatMessage[]>;
  ollama_model: string;
}

export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  start_date: string;
  nations: string[];
}

export interface PresetFull {
  id: string;
  name: string;
  description: string;
  start_date: string;
  world_before: string;
  simulation_rules: string;
  nations: Record<string, any>;
  regions: Record<string, any>;
  initial_relations: any[];
  initial_wars: any[];
  initial_alliances: any[];
}

export interface ActionSuggestion {
  action: string;
  category: string;
}
