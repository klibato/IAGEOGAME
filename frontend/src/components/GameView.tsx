import { useGameStore } from '../stores/gameStore';
import GameMap from './GameMap';
import TopBar from './TopBar';
import SidePanel from './SidePanel';
import BottomBar from './BottomBar';
import EventModal from './EventModal';

export default function GameView() {
  const showEventModal = useGameStore((s) => s.showEventModal);
  const isSimulating = useGameStore((s) => s.isSimulating);

  return (
    <div style={styles.container}>
      <TopBar />
      <div style={styles.main}>
        <div style={styles.mapContainer}>
          <GameMap />
        </div>
        <SidePanel />
      </div>
      <BottomBar />
      {showEventModal && <EventModal />}
      {isSimulating && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Simulation en cours... Le LLM genere les evenements.</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
};
