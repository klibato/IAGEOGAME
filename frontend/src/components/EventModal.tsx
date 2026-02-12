import { useGameStore } from '../stores/gameStore';
import { getCategoryIcon } from '../utils/mapUtils';

export default function EventModal() {
  const pendingEvents = useGameStore((s) => s.pendingEvents);
  const currentEventIndex = useGameStore((s) => s.currentEventIndex);
  const setCurrentEventIndex = useGameStore((s) => s.setCurrentEventIndex);
  const setShowEventModal = useGameStore((s) => s.setShowEventModal);
  const worldNarrative = useGameStore((s) => s.worldNarrative);
  const gameState = useGameStore((s) => s.gameState);

  if (!pendingEvents.length) return null;

  const isNarrative = currentEventIndex === -1;
  const event = !isNarrative ? pendingEvents[currentEventIndex] : null;
  const isLast = currentEventIndex >= pendingEvents.length - 1;
  const showNarrativeFirst = worldNarrative && currentEventIndex === 0;

  function handleNext() {
    if (isNarrative) {
      setCurrentEventIndex(0);
      return;
    }
    if (isLast) {
      setShowEventModal(false);
      return;
    }
    setCurrentEventIndex(currentEventIndex + 1);
  }

  function handleClose() {
    setShowEventModal(false);
  }

  // Show narrative intro first
  if (showNarrativeFirst && worldNarrative) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.narrativeHeader}>
            <h2 style={styles.narrativeTitle}>Resume de la periode</h2>
            <p style={styles.dateRange}>
              {gameState?.current_date}
            </p>
          </div>
          <div style={styles.narrativeBody}>
            <p style={styles.narrativeText}>{worldNarrative}</p>
          </div>
          <div style={styles.footer}>
            <span style={styles.counter}>
              {pendingEvents.length} evenement{pendingEvents.length > 1 ? 's' : ''} a suivre
            </span>
            <div style={styles.footerBtns}>
              <button className="btn" onClick={handleClose}>
                Passer tout
              </button>
              <button className="btn btn-primary" onClick={() => {/* keep going to event 0 */}}>
                Voir les evenements
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.categoryBadge}>
            <span>{getCategoryIcon(event.category)}</span>
            <span style={styles.categoryText}>{event.category.toUpperCase()}</span>
          </div>
          <span style={styles.eventDate}>{event.date}</span>
        </div>

        <h2 style={styles.eventTitle}>{event.title}</h2>

        <div style={styles.body}>
          <p style={styles.description}>{event.description}</p>

          {event.map_changes && event.map_changes.length > 0 && (
            <div style={styles.changesSection}>
              <h4 style={styles.changesTitle}>Changements sur la carte</h4>
              {event.map_changes.map((mc, i) => (
                <div key={i} style={styles.changeItem}>
                  {mc.type === 'transfer_region' && (
                    <span>Region {mc.region_id}: {mc.from_nation} → {mc.to_nation}</span>
                  )}
                  {mc.type === 'move_battalion' && (
                    <span>Mouvement: {mc.battalion_id} → {mc.new_region_id || 'nouvelle position'}</span>
                  )}
                  {mc.type === 'create_battalion' && (
                    <span>Nouveau bataillon: {mc.name} ({mc.nation_id})</span>
                  )}
                  {mc.type === 'destroy_battalion' && (
                    <span>Bataillon detruit: {mc.battalion_id}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {event.nations_involved && event.nations_involved.length > 0 && (
            <div style={styles.involved}>
              Nations impliquees: {event.nations_involved.map((nid) => {
                const n = gameState?.nations[nid];
                return n?.name || nid;
              }).join(', ')}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <span style={styles.counter}>
            Evenement {currentEventIndex + 1} / {pendingEvents.length}
          </span>
          <div style={styles.footerBtns}>
            <button className="btn" onClick={handleClose}>
              Fermer
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              {isLast ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    padding: 20,
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 12,
    maxWidth: 700,
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px 0',
  },
  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#0f0f1a',
    padding: '4px 10px',
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#a0a0b0',
    fontWeight: 600,
  },
  eventDate: {
    fontSize: 13,
    color: '#666680',
  },
  eventTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: '#c9a84c',
    padding: '12px 20px',
    lineHeight: 1.3,
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: '0 20px 16px',
  },
  description: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#e8e8e8',
    whiteSpace: 'pre-wrap',
  },
  changesSection: {
    marginTop: 16,
    padding: 12,
    background: '#0f0f1a',
    borderRadius: 6,
  },
  changesTitle: {
    fontSize: 11,
    color: '#c9a84c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  changeItem: {
    fontSize: 12,
    color: '#a0a0b0',
    padding: '4px 0',
    borderBottom: '1px solid #1a1a2e',
  },
  involved: {
    marginTop: 12,
    fontSize: 12,
    color: '#666680',
    fontStyle: 'italic',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderTop: '1px solid #2a2a3e',
  },
  counter: {
    fontSize: 12,
    color: '#666680',
  },
  footerBtns: {
    display: 'flex',
    gap: 8,
  },
  narrativeHeader: {
    padding: '20px 20px 0',
    textAlign: 'center',
  },
  narrativeTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    color: '#c9a84c',
  },
  dateRange: {
    fontSize: 13,
    color: '#666680',
    marginTop: 4,
  },
  narrativeBody: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
  },
  narrativeText: {
    fontSize: 15,
    lineHeight: 1.8,
    color: '#e8e8e8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};
