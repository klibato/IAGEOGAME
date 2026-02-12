import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import * as api from '../utils/api';
import type { PresetSummary, PresetFull, Difficulty } from '../types/game';

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'very_easy', label: 'Tres Facile', desc: 'Tout reussit. Le monde se plie a vos desirs.' },
  { value: 'easy', label: 'Facile', desc: 'Succes frequent. Peu de resistance.' },
  { value: 'normal', label: 'Normal', desc: 'Simulation realiste. Vos actions peuvent echouer.' },
  { value: 'hard', label: 'Difficile', desc: 'Planification requise. Echecs frequents et consequents.' },
  { value: 'impossible', label: 'Impossible', desc: 'Chaque erreur est fatale. Seule la perfection peut reussir.' },
];

export default function GameSetup() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setGameState = useGameStore((s) => s.setGameState);

  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PresetFull | null>(null);
  const [playerNation, setPlayerNation] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('mistral');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPresets();
    checkOllama();
  }, []);

  async function loadPresets() {
    try {
      const data = await api.listPresets();
      setPresets(data);
      if (data.length > 0) {
        const full = await api.getPreset(data[0].id);
        setSelectedPreset(full);
        const nationIds = Object.keys(full.nations);
        if (nationIds.length > 0) setPlayerNation(nationIds[0]);
      }
    } catch {
      setError('Impossible de charger les presets. Le backend est-il lance ?');
    }
  }

  async function checkOllama() {
    try {
      const status = await api.getOllamaStatus();
      if (status.status === 'ok') {
        setOllamaStatus('ok');
        const { models } = await api.getOllamaModels();
        const names = models.map((m: any) => m.name || m.model || '');
        setOllamaModels(names);
        if (names.length > 0) setSelectedModel(names[0]);
      } else {
        setOllamaStatus('error');
      }
    } catch {
      setOllamaStatus('error');
    }
  }

  async function handleSelectPreset(id: string) {
    try {
      const full = await api.getPreset(id);
      setSelectedPreset(full);
      const nationIds = Object.keys(full.nations);
      if (nationIds.length > 0) setPlayerNation(nationIds[0]);
    } catch {
      setError('Erreur chargement preset');
    }
  }

  async function handleStart() {
    if (!selectedPreset || !playerNation) return;
    setIsCreating(true);
    setError('');
    try {
      const { game_id, state } = await api.createGame(
        selectedPreset.id,
        playerNation,
        difficulty,
        selectedModel
      );
      setGameState(state);
      setScreen('game');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erreur creation de la partie');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>BELLUM MUNDI</h1>
        <p style={styles.subtitle}>Grand Strategy Sandbox</p>

        {error && <div style={styles.error}>{error}</div>}

        {/* Ollama status */}
        <div style={styles.statusRow}>
          <span>Ollama: </span>
          {ollamaStatus === 'checking' && <span style={{ color: '#f39c12' }}>Verification...</span>}
          {ollamaStatus === 'ok' && <span style={{ color: '#27ae60' }}>Connecte ({ollamaModels.length} modeles)</span>}
          {ollamaStatus === 'error' && <span style={{ color: '#c0392b' }}>Non disponible — lancez ollama serve</span>}
        </div>

        {/* Preset selection */}
        <div style={styles.section}>
          <label style={styles.label}>Scenario</label>
          <select
            style={styles.select}
            value={selectedPreset?.id || ''}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedPreset && (
            <p style={styles.presetDesc}>{selectedPreset.description}</p>
          )}
        </div>

        {/* Nation selection */}
        {selectedPreset && (
          <div style={styles.section}>
            <label style={styles.label}>Votre nation</label>
            <div style={styles.nationGrid}>
              {Object.entries(selectedPreset.nations).map(([id, n]: [string, any]) => (
                <button
                  key={id}
                  style={{
                    ...styles.nationBtn,
                    borderColor: playerNation === id ? '#c9a84c' : '#2a2a3e',
                    background: playerNation === id ? '#2a2a3e' : '#0f0f1a',
                  }}
                  onClick={() => setPlayerNation(id)}
                >
                  <span
                    style={{
                      ...styles.nationDot,
                      background: n.color,
                    }}
                  />
                  <span>{n.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div style={styles.section}>
          <label style={styles.label}>Difficulte</label>
          <div style={styles.diffGrid}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                style={{
                  ...styles.diffBtn,
                  borderColor: difficulty === d.value ? '#c9a84c' : '#2a2a3e',
                  background: difficulty === d.value ? '#2a2a3e' : '#0f0f1a',
                }}
                onClick={() => setDifficulty(d.value)}
              >
                <strong>{d.label}</strong>
                <span style={{ fontSize: 11, color: '#a0a0b0' }}>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Model selection */}
        {ollamaModels.length > 0 && (
          <div style={styles.section}>
            <label style={styles.label}>Modele LLM</label>
            <select
              style={styles.select}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {ollamaModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Start button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: 16, marginTop: 16 }}
          onClick={handleStart}
          disabled={isCreating || !selectedPreset || ollamaStatus !== 'ok'}
        >
          {isCreating ? (
            <><span className="spinner" style={{ width: 16, height: 16 }} /> Creation en cours...</>
          ) : (
            'Lancer la partie'
          )}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    overflow: 'auto',
    padding: 20,
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 12,
    padding: 32,
    maxWidth: 700,
    width: '100%',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 36,
    color: '#c9a84c',
    textAlign: 'center',
    letterSpacing: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: '#a0a0b0',
    marginBottom: 24,
    fontSize: 14,
  },
  error: {
    background: '#c0392b22',
    border: '1px solid #c0392b',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 12,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    fontSize: 13,
    color: '#a0a0b0',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    color: '#c9a84c',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
  },
  presetDesc: {
    marginTop: 6,
    fontSize: 12,
    color: '#a0a0b0',
    lineHeight: 1.5,
  },
  nationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  nationBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: '1px solid #2a2a3e',
    borderRadius: 6,
    background: '#0f0f1a',
    color: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
  },
  nationDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  diffGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
  },
  diffBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    padding: '8px 12px',
    border: '1px solid #2a2a3e',
    borderRadius: 6,
    background: '#0f0f1a',
    color: '#e8e8e8',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
};
