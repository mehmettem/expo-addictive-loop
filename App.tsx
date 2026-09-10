import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameScreen } from './src/demo/GameScreen';
import { ProgressionProvider } from './src/kit';

export default function App() {
  return (
    <SafeAreaProvider>
      <ProgressionProvider>
        <StatusBar style="light" />
        <GameScreen />
      </ProgressionProvider>
    </SafeAreaProvider>
  );
}
