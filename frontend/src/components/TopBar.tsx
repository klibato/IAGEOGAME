import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import * as api from '../utils/api';

const JUMP_OPTIONS = [
  { key: '1_week', label: '1 Semaine' },
  { key: '2_weeks', label: '2 Semaines' },
  { key: '1_month', label: '1 Mois' },
  { key: '3_months', label: '3 Mois' },
  { key: '6_months', label: '6 Mois' },
  { key: '1_year', label: '1 An' },
];

export default function TopBar() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const setIsSimulating = useGameStore((s) => s.isSimulating);
  const setPendingEvents = useGameStore((s) => s.setPendingEvents);
  const setShowEventModal = useGameStore((s) => s.setShowEventModal);
  const setCurrentEventIndex = useGameStore((s) => s.setCurrentEventIndex);
  const setWorldNarrative = useGameStore((s) => s.setWorldNarrative);
  const isSimulating = useGameStore((s) => s.isSimulating);
  const getPlayerNation = useGameStore((s) => s.getPlayerNation);

  const [showJumpMenu, setShowJumpMenu] = useState(false);

  const player = getPlayerNation();

  async function handleJump(duration: string) {
    if (!gameState) return;
    setShowJumpMenu(false);
    useGameStore.getState().setIsSimulating(true);

    try {
      const result = await api.jumpForward(gameState.game_id, duration);
      // Refresh game state
      const newState = await api.getGame(gameState.game_id);
      setGameState(newState);

      if (result.events && result.events.length > 0) {
        setPendingEvents(result.events);
        setCurrentEventIndex(0);
        setWorldNarrative(result.world_narrative || '');
        setShowEventModal(true);
      }
    } catch (e: any) {
      console.error('Jump failed:', e);
      alert('Erreur lors de la simulation: ' + (e.response?.data?.detail || e.message));
    } finally {
      useGameStore.getState().setIsSimulating(false);
    }
  }

  async function handleSave() {
    if (!gameState) return;
    const name = prompt('Nom de la sauvegarde:');
    if (!name) return;
    try {
      await api.saveGame(gameState.game_id, name);
      alert('Partie sauvegardee !');
    } catch {
      alert('Erreur sauvegarde');
    }
  }

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <span style={styles.logo}>BELLUM MUNDI</span>
        {player && (
          <span style={styles.nationTag}>
            <span style={{ ...styles.dot, background: player.color }} />
            {player.name}
          </span>
        )}
      </div>

      <div style={styles.center}>
        <span style={styles.date}>{gameState?.current_date || ''}</span>
        <span style={styles.turn}>Tour {gameState?.turn_number || 0}</span>
      </div>

      <div style={styles.right}>
        <button className="btn btn-small" onClick={handleSave}>
          Sauvegarder
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowJumpMenu(!showJumpMenu)}
            disabled={isSimulating}
          >
            Jump Forward
          </button>
          {showJumpMenu && (
            <div style={styles.jumpMenu}>
              {JUMP_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  style={styles.jumpOption}
                  onClick={() => handleJump(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    height: 48,
    background: '#1a1a2e',
    borderBottom: '1px solid #2a2a3e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 16,
    color: '#c9a84c',
    letterSpacing: 2,
  },
  nationTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#a0a0b0',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  date: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e8e8e8',
  },
  turn: {
    fontSize: 12,
    color: '#666680',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  jumpMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 1000,
    minWidth: 140,
  },
  jumpOption: {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    color: '#e8e8e8',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
  },
};
