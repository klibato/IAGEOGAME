import { useGameStore } from '../stores/gameStore';
import NationInfo from './NationInfo';
import ActionPanel from './ActionPanel';
import ChatPanel from './ChatPanel';
import AdvisorPanel from './AdvisorPanel';

export default function SidePanel() {
  const sidePanel = useGameStore((s) => s.sidePanel);

  return (
    <div style={styles.panel}>
      {sidePanel === 'info' && <NationInfo />}
      {sidePanel === 'actions' && <ActionPanel />}
      {sidePanel === 'chat' && <ChatPanel />}
      {sidePanel === 'advisor' && <AdvisorPanel />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 360,
    background: '#1a1a2eee',
    borderLeft: '1px solid #2a2a3e',
    overflow: 'auto',
    flexShrink: 0,
  },
};
