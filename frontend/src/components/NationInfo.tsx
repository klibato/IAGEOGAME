import { useGameStore } from '../stores/gameStore';
import { formatPopulation, getRelationColor } from '../utils/mapUtils';

export default function NationInfo() {
  const gameState = useGameStore((s) => s.gameState);
  const selectedNationId = useGameStore((s) => s.selectedNationId);
  const setChatTargetNationId = useGameStore((s) => s.setChatTargetNationId);
  const setSidePanel = useGameStore((s) => s.setSidePanel);

  if (!gameState) return null;

  const nationId = selectedNationId || gameState.player_nation_id;
  const nation = gameState.nations[nationId];
  if (!nation) return null;

  const isPlayer = nation.id === gameState.player_nation_id;
  const relation = gameState.diplomatic_relations[gameState.player_nation_id]?.[nationId] || 'neutral';

  function openChat() {
    setChatTargetNationId(nationId);
    setSidePanel('chat');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ ...styles.colorBadge, background: nation.color }} />
        <div>
          <h2 style={styles.name}>{nation.name}</h2>
          <p style={styles.leader}>{nation.leader} — {nation.government_type}</p>
        </div>
      </div>

      {isPlayer && <div style={styles.playerBadge}>VOTRE NATION</div>}

      {!isPlayer && (
        <div style={{ ...styles.relationBadge, background: getRelationColor(relation) + '33', borderColor: getRelationColor(relation) }}>
          Relation: {relation.toUpperCase().replace('_', ' ')}
        </div>
      )}

      {nation.description && (
        <p style={styles.description}>{nation.description}</p>
      )}

      <div style={styles.statsSection}>
        <h3 style={styles.sectionTitle}>Statistiques</h3>
        <StatBar label="Militaire" value={nation.military_strength} color="#e74c3c" />
        <StatBar label="Economie" value={nation.economic_strength} color="#f1c40f" />
        <StatBar label="Stabilite" value={nation.stability} color="#2ecc71" />
      </div>

      <div style={styles.infoGrid}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Population</span>
          <span style={styles.infoValue}>{formatPopulation(nation.population)}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Regions</span>
          <span style={styles.infoValue}>{nation.regions_controlled.length}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Bataillons</span>
          <span style={styles.infoValue}>{nation.battalions.length}</span>
        </div>
      </div>

      {nation.tags.length > 0 && (
        <div style={styles.tags}>
          {nation.tags.map((tag) => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {nation.battalions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Forces armees</h3>
          {nation.battalions.map((btn) => (
            <div key={btn.id} style={styles.battalionRow}>
              <span style={styles.battalionName}>{btn.name}</span>
              <span style={styles.battalionInfo}>
                {btn.type} — {btn.strength.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isPlayer && (
        <button
          className="btn"
          style={{ width: '100%', marginTop: 12 }}
          onClick={openChat}
        >
          Ouvrir le chat diplomatique
        </button>
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-bar">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="stat-bar-value">{Math.round(value)}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  colorBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    flexShrink: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e8e8e8',
  },
  leader: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  playerBadge: {
    background: '#c9a84c33',
    border: '1px solid #c9a84c',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    color: '#c9a84c',
    textAlign: 'center',
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 12,
  },
  relationBadge: {
    border: '1px solid',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 600,
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    color: '#a0a0b0',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  statsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#c9a84c',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 12,
  },
  infoItem: {
    background: '#0f0f1a',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
  },
  infoLabel: {
    display: 'block',
    fontSize: 10,
    color: '#666680',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    display: 'block',
    fontSize: 16,
    fontWeight: 700,
    color: '#e8e8e8',
    marginTop: 2,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  tag: {
    fontSize: 10,
    padding: '2px 8px',
    background: '#16213e',
    borderRadius: 10,
    color: '#a0a0b0',
  },
  section: {
    marginBottom: 12,
  },
  battalionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #1a1a2e',
  },
  battalionName: {
    fontSize: 12,
    color: '#e8e8e8',
  },
  battalionInfo: {
    fontSize: 11,
    color: '#666680',
  },
};
