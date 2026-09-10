import * as Haptics from 'expo-haptics';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export const feedback = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  miss: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
};

export function useScreenShake() {
  const translateX = useRef(new Animated.Value(0)).current;
  const shake = useCallback(
    (strength = 8) => {
      translateX.stopAnimation();
      Animated.sequence(
        [-1, 1, -0.7, 0.7, 0].map((direction) =>
          Animated.timing(translateX, {
            toValue: strength * direction,
            duration: 45,
            useNativeDriver: true,
          }),
        ),
      ).start();
    },
    [translateX],
  );
  return { shake, shakeStyle: { transform: [{ translateX }] } };
}

type ParticleBurstProps = {
  burstKey: number;
  color?: string;
  count?: number;
};

export function ParticleBurst({ burstKey, color = '#FFD166', count = 12 }: ParticleBurstProps) {
  const progress = useRef(new Animated.Value(1)).current;
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / count + Math.random() * 0.3;
        const distance = 55 + Math.random() * 70;
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, size: 4 + Math.random() * 7 };
      }),
    [burstKey, count],
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burstKey, progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, index) => (
        <Animated.View
          key={`${burstKey}-${index}`}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: color,
              opacity: progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 0.8, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.2, 1, 0.4] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ShakeView({
  style,
  children,
}: PropsWithChildren<{ style: { transform: { translateX: Animated.Value }[] } }>) {
  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

/** Implement this adapter with expo-audio, expo-av, or your own sound system. */
export type SoundEffects = {
  play(name: 'intent' | 'success' | 'miss' | 'purchase'): void;
  setMuted(muted: boolean): void;
};

export const silentSoundEffects: SoundEffects = { play: () => undefined, setMuted: () => undefined };

const styles = StyleSheet.create({
  fill: { flex: 1 },
  particle: { position: 'absolute', left: '50%', top: '50%' },
});
