import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/demo/GameScreen';
import { ProgressionProvider } from './src/kit';

export default function App() {
  return (
    <ProgressionProvider>
      <StatusBar style="light" />
      <GameScreen />
    </ProgressionProvider>
  );
}
