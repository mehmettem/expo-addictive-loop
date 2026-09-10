import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ParticleBurst,
  RARITY_COLORS,
  ShakeView,
  accuracyScore,
  difficultyForLevel,
  drawCollectible,
  feedback,
  upgradeEffect,
  upgradePrice,
  useGameLoop,
  useProgression,
  useScreenShake,
  xpForLevel,
} from '../kit';
import { FISH, UPGRADES } from './content';

type CatchResult = {
  success: boolean;
  score: number;
  fish?: (typeof FISH)[number];
  coins: number;
  xp: number;
};

type Panel = 'collection' | 'shop' | null;
const TRACK_WIDTH = Dimensions.get('window').width - 64;

export function GameScreen() {
  const { state: loop, send } = useGameLoop<CatchResult>();
  const { state, hydrated, award, buy } = useProgression();
  const marker = useRef(new Animated.Value(0)).current;
  const markerAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const [targetCenter, setTargetCenter] = useState(0.55);
  const [panel, setPanel] = useState<Panel>(null);
  const { shake, shakeStyle } = useScreenShake();

  const rodLevel = state.upgrades.rod ?? 0;
  const lureLevel = state.upgrades.lure ?? 0;
  const reelLevel = state.upgrades.reel ?? 0;
  const difficulty = difficultyForLevel(state.level);
  const targetWidth = Math.min(0.34, difficulty.targetWidth * upgradeEffect(rodLevel, 0.05));

  useEffect(
    () => () => {
      markerAnimation.current?.stop();
    },
    [],
  );

  const beginChallenge = () => {
    feedback.tap();
    send({ type: 'BEGIN' });
    const center = targetWidth / 2 + Math.random() * (1 - targetWidth);
    setTargetCenter(center);
    marker.setValue(0);
    setTimeout(() => {
      send({ type: 'CHALLENGE' });
      const duration = 820 / difficulty.speed;
      markerAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(marker, { toValue: 1, duration, useNativeDriver: false }),
          Animated.timing(marker, { toValue: 0, duration, useNativeDriver: false }),
        ]),
      );
      markerAnimation.current.start();
    }, 280);
  };

  const resolveCatch = () => {
    markerAnimation.current?.stop();
    marker.stopAnimation((position) => {
      const score = accuracyScore(position, targetCenter, targetWidth);
      const success = score > 0;
      if (!success) {
        const result = { success: false, score: 0, coins: 0, xp: 4 };
        send({ type: 'RESOLVE', result });
        award(result);
        feedback.miss();
        shake();
        return;
      }

      const fish = drawCollectible(FISH, state.level, upgradeEffect(lureLevel, 0.2));
      const precision = 0.65 + score * 0.7;
      const coins = Math.round(
        fish.value * precision * difficulty.rewardMultiplier * upgradeEffect(reelLevel, 0.1),
      );
      const xp = Math.round(12 + fish.value * 0.65 + score * 8);
      const result = { success: true, score: score * 100, fish, coins, xp };
      send({ type: 'RESOLVE', result });
      award({ ...result, collectibleId: fish.id });
      feedback.success();
    });
  };

  const replay = () => {
    send({ type: 'REPLAY' });
    setTimeout(beginChallenge, 80);
  };

  const action =
    loop.scene === 'ready'
      ? { label: 'CAST THE LINE', hint: 'Tap to cast', press: beginChallenge }
      : loop.scene === 'challenge'
        ? { label: 'HOOK!', hint: 'Land inside the glowing zone', press: resolveCatch }
        : loop.scene === 'outcome'
          ? { label: 'CAST AGAIN', hint: 'Instant replay', press: replay }
          : { label: 'CASTING…', hint: 'Watch the water', press: undefined };

  return (
    <LinearGradient colors={['#0B2744', '#0D6B82', '#052B46']} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ShakeView style={shakeStyle}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>TIDELINE</Text>
              <Text style={styles.level}>LEVEL {state.level} · {state.dailyStreak} DAY TIDE 🔥</Text>
            </View>
            <View style={styles.coins}><Text style={styles.coinText}>● {state.coins}</Text></View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(state.xp / xpForLevel(state.level)) * 100}%` }]} />
          </View>

          <View style={styles.nav}>
            <NavButton emoji="🐚" label="Collection" onPress={() => setPanel('collection')} />
            <NavButton emoji="🛠️" label="Upgrades" onPress={() => setPanel('shop')} />
          </View>

          <View style={styles.scene}>
            <View style={styles.sun} />
            <Text style={styles.cloud}>·  ☁️   ·       ☁️</Text>
            <View style={styles.boat}>
              <Text style={styles.boatPerson}>🧑‍🌾</Text>
              <View style={styles.hull}><Text style={styles.boatName}>LOOP</Text></View>
            </View>
            <View style={styles.waveBack} />
            <View style={styles.waveFront} />

            {loop.scene === 'outcome' && loop.result && (
              <View style={styles.resultCard}>
                {loop.result.success && loop.result.fish ? (
                  <>
                    <Text style={styles.catchEmoji}>{loop.result.fish.emoji}</Text>
                    <Text style={[styles.rarity, { color: RARITY_COLORS[loop.result.fish.rarity] }]}>
                      {loop.result.fish.rarity.toUpperCase()} CATCH
                    </Text>
                    <Text style={styles.catchName}>{loop.result.fish.name}</Text>
                    <Text style={styles.reward}>+{loop.result.coins} coins  ·  +{loop.result.xp} XP</Text>
                    <ParticleBurst burstKey={loop.attempt} color={RARITY_COLORS[loop.result.fish.rarity]} />
                  </>
                ) : (
                  <>
                    <Text style={styles.catchEmoji}>💦</Text>
                    <Text style={styles.catchName}>It slipped away!</Text>
                    <Text style={styles.reward}>So close · +4 XP</Text>
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <Text style={styles.streak}>{state.streak > 1 ? `${state.streak} catch streak! 🔥` : 'Find your rhythm'}</Text>
            <View style={styles.timingTrack}>
              <View
                style={[
                  styles.target,
                  { left: `${(targetCenter - targetWidth / 2) * 100}%`, width: `${targetWidth * 100}%` },
                ]}
              />
              {(loop.scene === 'challenge' || loop.scene === 'intent') && (
                <Animated.View
                  style={[
                    styles.marker,
                    { left: marker.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_WIDTH - 8] }) },
                  ]}
                />
              )}
            </View>
            <Text style={styles.hint}>{action.hint}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!action.press || !hydrated}
              onPress={action.press}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <LinearGradient colors={['#FFD166', '#FF9F43']} style={styles.actionGradient}>
                <Text style={styles.actionText}>{hydrated ? action.label : 'LOADING TIDE…'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ShakeView>
      </SafeAreaView>
      <Modal visible={panel !== null} transparent animationType="slide" onRequestClose={() => setPanel(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>{panel === 'collection' ? 'Ocean Log' : 'Dock Shop'}</Text>
              <Pressable onPress={() => setPanel(null)} hitSlop={16}><Text style={styles.close}>✕</Text></Pressable>
            </View>
            {panel === 'collection' ? (
              <CollectionPanel collection={state.collection} level={state.level} />
            ) : (
              <ShopPanel coins={state.coins} levels={state.upgrades} onBuy={buy} />
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function NavButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}>
      <Text style={styles.navEmoji}>{emoji}</Text><Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

function CollectionPanel({ collection, level }: { collection: Record<string, { count: number; bestScore: number }>; level: number }) {
  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {FISH.map((fish) => {
        const entry = collection[fish.id];
        const locked = fish.minLevel > level;
        return (
          <View key={fish.id} style={[styles.collectionCard, { borderColor: RARITY_COLORS[fish.rarity] }]}>
            <Text style={styles.collectionEmoji}>{entry ? fish.emoji : locked ? '🔒' : '❔'}</Text>
            <Text style={styles.cardName}>{entry ? fish.name : locked ? `Level ${fish.minLevel}` : 'Undiscovered'}</Text>
            <Text style={styles.cardMeta}>{entry ? `Caught ${entry.count} · Best ${entry.bestScore}%` : fish.rarity}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function ShopPanel({ coins, levels, onBuy }: { coins: number; levels: Record<string, number>; onBuy: (upgrade: (typeof UPGRADES)[number]) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.shopList}>
      <Text style={styles.shopBalance}>● {coins} available</Text>
      {UPGRADES.map((upgrade) => {
        const level = levels[upgrade.id] ?? 0;
        const price = upgradePrice(upgrade, level);
        const maxed = level >= upgrade.maxLevel;
        return (
          <View key={upgrade.id} style={styles.shopCard}>
            <Text style={styles.shopEmoji}>{upgrade.emoji}</Text>
            <View style={styles.shopCopy}>
              <Text style={styles.cardName}>{upgrade.name} · Lv {level}</Text>
              <Text style={styles.cardMeta}>{upgrade.description}</Text>
            </View>
            <Pressable
              disabled={maxed || coins < price}
              onPress={() => { feedback.tap(); onBuy(upgrade); }}
              style={[styles.buy, (maxed || coins < price) && styles.buyDisabled]}
            >
              <Text style={styles.buyText}>{maxed ? 'MAX' : `● ${price}`}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10 },
  brand: { color: '#FFF', fontSize: 25, fontWeight: '900', letterSpacing: 3 },
  level: { color: '#98DCE8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  coins: { backgroundColor: 'rgba(3,20,35,.55)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' },
  coinText: { color: '#FFD166', fontWeight: '900', fontSize: 16 },
  progressTrack: { height: 4, marginHorizontal: 22, marginTop: 10, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#65E7D7' },
  nav: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginTop: 14, zIndex: 2 },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(5,31,50,.65)', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 15 },
  navPressed: { opacity: 0.7 },
  navEmoji: { fontSize: 16 },
  navLabel: { color: '#DFFAFF', fontSize: 12, fontWeight: '800' },
  scene: { flex: 1, minHeight: 270, overflow: 'hidden' },
  sun: { position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: '#FFD982', opacity: 0.9, right: 35, top: 34, shadowColor: '#FFD166', shadowOpacity: 0.7, shadowRadius: 24 },
  cloud: { color: 'rgba(255,255,255,.72)', fontSize: 36, position: 'absolute', top: 10, left: 15 },
  boat: { position: 'absolute', alignSelf: 'center', bottom: 69, alignItems: 'center', zIndex: 3 },
  boatPerson: { fontSize: 47, marginBottom: -13 },
  hull: { width: 135, height: 43, backgroundColor: '#FF775F', borderBottomLeftRadius: 65, borderBottomRightRadius: 65, borderTopRightRadius: 8, borderTopLeftRadius: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6, borderBottomColor: '#CB4C4A' },
  boatName: { color: '#6D2630', fontWeight: '900', letterSpacing: 4 },
  waveBack: { position: 'absolute', height: 110, backgroundColor: '#147D97', left: -30, right: -30, bottom: -30, borderTopLeftRadius: 90, borderTopRightRadius: 160, transform: [{ rotate: '-2deg' }] },
  waveFront: { position: 'absolute', height: 80, backgroundColor: '#075973', left: -40, right: -40, bottom: -35, borderTopLeftRadius: 180, borderTopRightRadius: 100, transform: [{ rotate: '3deg' }] },
  resultCard: { position: 'absolute', zIndex: 5, alignSelf: 'center', top: 36, width: 245, padding: 14, alignItems: 'center', borderRadius: 24, backgroundColor: 'rgba(3,22,37,.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  catchEmoji: { fontSize: 62 },
  rarity: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  catchName: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  reward: { color: '#B8E7ED', fontWeight: '700', marginTop: 5 },
  controls: { paddingHorizontal: 32, paddingBottom: 22, alignItems: 'center' },
  streak: { color: '#D6F8FA', fontWeight: '800', marginBottom: 10 },
  timingTrack: { width: '100%', height: 28, borderRadius: 14, backgroundColor: 'rgba(2,19,32,.74)', borderWidth: 2, borderColor: 'rgba(255,255,255,.15)', overflow: 'hidden' },
  target: { position: 'absolute', height: '100%', backgroundColor: '#4FE0A8', shadowColor: '#4FE0A8', shadowOpacity: 1, shadowRadius: 10 },
  marker: { position: 'absolute', width: 8, height: '100%', borderRadius: 4, backgroundColor: '#FFF' },
  hint: { color: '#9ED4DD', fontSize: 12, marginTop: 8, marginBottom: 12 },
  action: { width: '100%', minHeight: 64, borderRadius: 22, overflow: 'hidden', shadowColor: '#FFAD42', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  actionPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  actionGradient: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#3A260B', fontWeight: '900', fontSize: 18, letterSpacing: 1.2 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,9,18,.55)' },
  sheet: { height: '72%', backgroundColor: '#09243A', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 9, paddingHorizontal: 20 },
  sheetHandle: { width: 46, height: 5, borderRadius: 3, backgroundColor: '#527386', alignSelf: 'center' },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  sheetTitle: { color: '#FFF', fontSize: 27, fontWeight: '900' },
  close: { color: '#9EC5D1', fontSize: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 35 },
  collectionCard: { width: '48%', minHeight: 130, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D3049', borderWidth: 1, borderRadius: 18, padding: 10 },
  collectionEmoji: { fontSize: 42 },
  cardName: { color: '#F2FCFF', fontWeight: '900', fontSize: 15, marginTop: 4 },
  cardMeta: { color: '#8CB8C5', fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  shopList: { gap: 12, paddingBottom: 35 },
  shopBalance: { color: '#FFD166', fontWeight: '900', marginBottom: 4 },
  shopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D3049', borderRadius: 18, padding: 14, minHeight: 82 },
  shopEmoji: { fontSize: 32, marginRight: 12 },
  shopCopy: { flex: 1 },
  buy: { backgroundColor: '#FFD166', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginLeft: 8 },
  buyDisabled: { opacity: 0.35 },
  buyText: { color: '#3A260B', fontWeight: '900', fontSize: 12 },
});
