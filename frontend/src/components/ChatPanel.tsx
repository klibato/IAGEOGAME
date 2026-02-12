import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import * as api from '../utils/api';

export default function ChatPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const chatTargetNationId = useGameStore((s) => s.chatTargetNationId);
  const setChatTargetNationId = useGameStore((s) => s.setChatTargetNationId);

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!gameState) return null;

  const otherNations = Object.values(gameState.nations).filter(
    (n) => n.id !== gameState.player_nation_id
  );

  const targetNation = chatTargetNationId
    ? gameState.nations[chatTargetNationId]
    : null;

  const chatHistory = chatTargetNationId
    ? gameState.chat_histories[chatTargetNationId] || []
    : [];

  async function handleSend() {
    if (!message.trim() || !chatTargetNationId || !gameState) return;
    setIsSending(true);
    try {
      await api.sendChat(gameState.game_id, chatTargetNationId, message.trim());
      const newState = await api.getGame(gameState.game_id);
      setGameState(newState);
      setMessage('');
    } catch (e) {
      console.error('Chat failed:', e);
    } finally {
      setIsSending(false);
    }
  }

  // Nation selection view
  if (!chatTargetNationId) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Diplomatie</h3>
        <p style={styles.hint}>Choisissez une nation pour ouvrir un canal diplomatique.</p>
        <div style={styles.nationList}>
          {otherNations.map((n) => {
            const relation = gameState.diplomatic_relations[gameState.player_nation_id]?.[n.id] || 'neutral';
            const hasHistory = (gameState.chat_histories[n.id]?.length || 0) > 0;
            return (
              <button
                key={n.id}
                style={styles.nationBtn}
                onClick={() => setChatTargetNationId(n.id)}
              >
                <span style={{ ...styles.dot, background: n.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#e8e8e8' }}>{n.name}</div>
                  <div style={{ fontSize: 11, color: '#666680' }}>
                    {n.leader} — {relation}
                    {hasHistory && ' (conversation en cours)'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div style={styles.container}>
      <div style={styles.chatHeader}>
        <button
          className="btn btn-small"
          onClick={() => setChatTargetNationId(null)}
        >
          Retour
        </button>
        <span style={{ ...styles.dot, background: targetNation?.color || '#888' }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>{targetNation?.name || ''}</span>
      </div>

      <div style={styles.chatMessages}>
        {chatHistory.length === 0 && (
          <p style={styles.noMessages}>
            Aucun message. Commencez la discussion diplomatique.
          </p>
        )}
        {chatHistory.map((msg, i) => {
          const isPlayer = msg.sender === 'player';
          return (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf: isPlayer ? 'flex-end' : 'flex-start',
                background: isPlayer ? '#16213e' : '#0f0f1a',
                borderColor: isPlayer ? '#4a6fa5' : '#2a2a3e',
              }}
            >
              <div style={styles.msgSender}>
                {isPlayer ? 'Vous' : targetNation?.name}
              </div>
              <div style={styles.msgContent}>{msg.content}</div>
            </div>
          );
        })}
      </div>

      <div style={styles.chatInput}>
        <textarea
          style={{ ...styles.textarea, flex: 1 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ecrivez votre message diplomatique..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={!message.trim() || isSending}
        >
          {isSending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
  nationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  nationBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: 6,
    color: '#e8e8e8',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #2a2a3e',
  },
  chatMessages: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  noMessages: {
    fontSize: 12,
    color: '#666680',
    textAlign: 'center',
    padding: 20,
  },
  message: {
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid',
  },
  msgSender: {
    fontSize: 10,
    color: '#c9a84c',
    marginBottom: 4,
    fontWeight: 600,
  },
  msgContent: {
    fontSize: 13,
    lineHeight: 1.5,
    color: '#e8e8e8',
    whiteSpace: 'pre-wrap',
  },
  chatInput: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  textarea: {
    width: '100%',
    minHeight: 60,
  },
};
