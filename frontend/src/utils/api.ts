import axios from 'axios';
import type {
  GameState,
  PresetSummary,
  PresetFull,
  GameEvent,
  PlayerAction,
  ChatMessage,
  ActionSuggestion,
} from '../types/game';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for LLM calls
});

// ── Presets ──────────────────────────────────────────────────────────────────

export async function listPresets(): Promise<PresetSummary[]> {
  const { data } = await api.get('/presets');
  return data;
}

export async function getPreset(id: string): Promise<PresetFull> {
  const { data } = await api.get(`/presets/${id}`);
  return data;
}

// ── Ollama ───────────────────────────────────────────────────────────────────

export async function getOllamaModels(): Promise<{ models: any[] }> {
  const { data } = await api.get('/ollama/models');
  return data;
}

export async function getOllamaStatus(): Promise<{ status: string; error?: string }> {
  const { data } = await api.get('/ollama/status');
  return data;
}

// ── Game ─────────────────────────────────────────────────────────────────────

export async function createGame(
  presetId: string,
  playerNationId: string,
  difficulty: string,
  ollamaModel: string
): Promise<{ game_id: string; state: GameState }> {
  const { data } = await api.post('/game/create', {
    preset_id: presetId,
    player_nation_id: playerNationId,
    difficulty,
    ollama_model: ollamaModel,
  });
  return data;
}

export async function getGame(gameId: string): Promise<GameState> {
  const { data } = await api.get(`/game/${gameId}`);
  return data;
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function submitAction(
  gameId: string,
  text: string
): Promise<{ action_id: string; actions: PlayerAction[] }> {
  const { data } = await api.post(`/game/${gameId}/action`, { text });
  return data;
}

export async function deleteAction(
  gameId: string,
  actionId: string
): Promise<{ actions: PlayerAction[] }> {
  const { data } = await api.delete(`/game/${gameId}/action/${actionId}`);
  return data;
}

// ── Jump Forward ─────────────────────────────────────────────────────────────

export async function jumpForward(
  gameId: string,
  duration: string,
  customDays?: number
): Promise<{
  events: GameEvent[];
  new_date: string;
  turn_number: number;
  world_narrative: string;
}> {
  const { data } = await api.post(`/game/${gameId}/jump`, {
    duration,
    custom_days: customDays,
  });
  return data;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChat(
  gameId: string,
  targetNationId: string,
  message: string
): Promise<{ response: string; chat_history: ChatMessage[] }> {
  const { data } = await api.post(`/game/${gameId}/chat`, {
    target_nation_id: targetNationId,
    message,
  });
  return data;
}

// ── Advisor ──────────────────────────────────────────────────────────────────

export async function askAdvisor(
  gameId: string,
  question: string
): Promise<{ response: string }> {
  const { data } = await api.post(`/game/${gameId}/advisor`, { question });
  return data;
}

// ── Brainstorm & Enhance ─────────────────────────────────────────────────────

export async function brainstormActions(
  gameId: string
): Promise<{ suggestions: ActionSuggestion[] }> {
  const { data } = await api.post(`/game/${gameId}/brainstorm`);
  return data;
}

export async function enhanceAction(
  gameId: string,
  actionText: string
): Promise<{ enhanced_action: string }> {
  const { data } = await api.post(`/game/${gameId}/enhance`, {
    action_text: actionText,
  });
  return data;
}

// ── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(
  gameId: string
): Promise<{ events: GameEvent[] }> {
  const { data } = await api.get(`/game/${gameId}/events`);
  return data;
}

// ── Save / Load ──────────────────────────────────────────────────────────────

export async function saveGame(
  gameId: string,
  name: string
): Promise<{ save_id: string; name: string }> {
  const { data } = await api.post(`/game/${gameId}/save`, { name });
  return data;
}

export async function listSaves(): Promise<{
  saves: { save_id: string; game_id: string; name: string; created_at: string }[];
}> {
  const { data } = await api.get('/game/saves');
  return data;
}

export async function loadSave(
  saveId: string
): Promise<{ game_id: string; state: GameState }> {
  const { data } = await api.post(`/game/load/${saveId}`);
  return data;
}
