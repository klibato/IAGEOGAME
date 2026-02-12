import { useGameStore, type SidePanel as PanelType } from '../stores/gameStore';

const TABS: { key: PanelType; label: string; icon: string }[] = [
  { key: 'info', label: 'Info', icon: '\u{2139}' },
  { key: 'actions', label: 'Actions', icon: '\u{26A1}' },
  { key: 'chat', label: 'Diplomatie', icon: '\u{1F4AC}' },
  { key: 'advisor', label: 'Conseiller', icon: '\u{1F9E0}' },
];

export default function BottomBar() {
  const sidePanel = useGameStore((s) => s.sidePanel);
  const setSidePanel = useGameStore((s) => s.setSidePanel);
  const gameState = useGameStore((s) => s.gameState);

  return (
    <div style={styles.bar}>
      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              borderBottomColor: sidePanel === tab.key ? '#c9a84c' : 'transparent',
              color: sidePanel === tab.key ? '#c9a84c' : '#a0a0b0',
            }}
            onClick={() => setSidePanel(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div style={styles.statusRight}>
        <span style={{ fontSize: 11, color: '#666680' }}>
          {gameState?.pending_actions.length || 0} action(s) en attente
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    height: 40,
    background: '#1a1a2e',
    borderTop: '1px solid #2a2a3e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#a0a0b0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};
