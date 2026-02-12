import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import * as api from '../utils/api';

export default function ActionPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);

  const [actionText, setActionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<{ action: string; category: string }[]>([]);

  if (!gameState) return null;

  async function handleSubmit() {
    if (!actionText.trim() || !gameState) return;
    setIsSubmitting(true);
    try {
      const result = await api.submitAction(gameState.game_id, actionText.trim());
      const newState = await api.getGame(gameState.game_id);
      setGameState(newState);
      setActionText('');
    } catch (e) {
      console.error('Submit action failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(actionId: string) {
    if (!gameState) return;
    try {
      await api.deleteAction(gameState.game_id, actionId);
      const newState = await api.getGame(gameState.game_id);
      setGameState(newState);
    } catch (e) {
      console.error('Delete action failed:', e);
    }
  }

  async function handleBrainstorm() {
    if (!gameState) return;
    setIsBrainstorming(true);
    setSuggestions([]);
    try {
      const result = await api.brainstormActions(gameState.game_id);
      setSuggestions(result.suggestions || []);
    } catch (e) {
      console.error('Brainstorm failed:', e);
    } finally {
      setIsBrainstorming(false);
    }
  }

  async function handleEnhance() {
    if (!actionText.trim() || !gameState) return;
    setIsEnhancing(true);
    try {
      const result = await api.enhanceAction(gameState.game_id, actionText);
      setActionText(result.enhanced_action);
    } catch (e) {
      console.error('Enhance failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  }

  function useSuggestion(text: string) {
    setActionText(text);
    setSuggestions([]);
  }

  const categoryColors: Record<string, string> = {
    military: '#e74c3c',
    diplomatic: '#3498db',
    economic: '#f1c40f',
    internal: '#9b59b6',
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Actions</h3>
      <p style={styles.hint}>
        Ecrivez vos ordres en langage naturel. Ils seront simules au prochain Jump Forward.
      </p>

      <textarea
        style={styles.textarea}
        value={actionText}
        onChange={(e) => setActionText(e.target.value)}
        placeholder="Ex: Mobiliser 200 000 reservistes a la frontiere est..."
        rows={4}
      />

      <div style={styles.btnRow}>
        <button
          className="btn btn-primary btn-small"
          onClick={handleSubmit}
          disabled={!actionText.trim() || isSubmitting}
        >
          {isSubmitting ? 'Envoi...' : 'Soumettre'}
        </button>
        <button
          className="btn btn-small"
          onClick={handleEnhance}
          disabled={!actionText.trim() || isEnhancing}
        >
          {isEnhancing ? 'Amelioration...' : 'Ameliorer'}
        </button>
        <button
          className="btn btn-small"
          onClick={handleBrainstorm}
          disabled={isBrainstorming}
        >
          {isBrainstorming ? 'Reflexion...' : 'Brainstorm'}
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={styles.suggestionsBox}>
          <h4 style={styles.subTitle}>Suggestions</h4>
          {suggestions.map((s, i) => (
            <button
              key={i}
              style={styles.suggestion}
              onClick={() => useSuggestion(s.action)}
            >
              <span
                style={{
                  ...styles.catDot,
                  background: categoryColors[s.category] || '#888',
                }}
              />
              {s.action}
            </button>
          ))}
        </div>
      )}

      {/* Pending actions */}
      {gameState.pending_actions.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.subTitle}>Actions en attente ({gameState.pending_actions.length})</h4>
          {gameState.pending_actions.map((a) => (
            <div key={a.id} style={styles.actionItem}>
              <p style={styles.actionText}>{a.text}</p>
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleDelete(a.id)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
  },
  title: {
    fontSize: 14,
    color: '#c9a84c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: 600,
  },
  hint: {
    fontSize: 12,
    color: '#666680',
    marginBottom: 10,
    lineHeight: 1.4,
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    marginBottom: 8,
  },
  btnRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 12,
  },
  suggestionsBox: {
    background: '#0f0f1a',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 11,
    color: '#a0a0b0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestion: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    padding: '6px 8px',
    background: 'transparent',
    border: '1px solid #2a2a3e',
    borderRadius: 4,
    color: '#e8e8e8',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 4,
    flexShrink: 0,
  },
  section: {
    marginTop: 12,
  },
  actionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px',
    background: '#0f0f1a',
    borderRadius: 6,
    marginBottom: 6,
  },
  actionText: {
    flex: 1,
    fontSize: 12,
    color: '#e8e8e8',
    lineHeight: 1.4,
  },
};
