import { useGameStore } from './stores/gameStore';
import GameSetup from './components/GameSetup';
import GameView from './components/GameView';
import './App.css';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app">
      {screen === 'setup' ? <GameSetup /> : <GameView />}
    </div>
  );
}
