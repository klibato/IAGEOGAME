import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import * as api from '../utils/api';

export default function AdvisorPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [responses, setResponses] = useState<{ q: string; a: string }[]>([]);

  if (!gameState) return null;

  async function handleAsk() {
    if (!question.trim() || !gameState) return;
    setIsAsking(true);
    const q = question.trim();
    setQuestion('');
    try {
      const result = await api.askAdvisor(gameState.game_id, q);
      setResponses((prev) => [...prev, { q, a: result.response }]);
    } catch (e) {
      console.error('Advisor failed:', e);
      setResponses((prev) => [
        ...prev,
        { q, a: "Erreur: impossible de contacter le conseiller." },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Conseiller Strategique</h3>
      <p style={styles.hint}>
        Posez des questions sur la situation mondiale, demandez des conseils strategiques
        ou une analyse de vos options.
      </p>

      <div style={styles.messages}>
        {responses.length === 0 && (
          <div style={styles.empty}>
            <p>Exemples de questions :</p>
            <ul style={styles.examples}>
              <li>Quelles sont les forces militaires de la Chine ?</li>
              <li>Comment devrais-je gerer la menace russe ?</li>
              <li>Quelles sont mes options si la Turquie attaque ?</li>
              <li>Quel est l'etat de mon economie ?</li>
            </ul>
          </div>
        )}
        {responses.map((r, i) => (
          <div key={i} style={styles.exchange}>
            <div style={styles.question}>
              <span style={styles.qLabel}>Vous</span>
              <p>{r.q}</p>
            </div>
            <div style={styles.answer}>
              <span style={styles.aLabel}>Conseiller</span>
              <p style={{ whiteSpace: 'pre-wrap' }}>{r.a}</p>
            </div>
          </div>
        ))}
        {isAsking && (
          <div style={styles.answer}>
            <span style={styles.aLabel}>Conseiller</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner" />
              <span style={{ color: '#666680', fontSize: 13 }}>Analyse en cours...</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.inputRow}>
        <textarea
          style={{ flex: 1 }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Posez votre question au conseiller..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleAsk}
          disabled={!question.trim() || isAsking}
        >
          Demander
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
  messages: {
    flex: 1,
    overflow: 'auto',
    marginBottom: 12,
  },
  empty: {
    fontSize: 12,
    color: '#666680',
    padding: 12,
  },
  examples: {
    marginTop: 8,
    paddingLeft: 16,
    lineHeight: 2,
  },
  exchange: {
    marginBottom: 16,
  },
  question: {
    background: '#16213e',
    border: '1px solid #4a6fa5',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 1.5,
  },
  answer: {
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    lineHeight: 1.6,
  },
  qLabel: {
    fontSize: 10,
    color: '#4a6fa5',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aLabel: {
    fontSize: 10,
    color: '#c9a84c',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
};
