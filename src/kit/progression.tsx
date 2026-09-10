import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { CollectionState, addToCollection } from './collection';
import { UpgradeDefinition, UpgradeLevels, purchaseUpgrade } from './shop';

const STORAGE_KEY = '@addictive-loop/progression-v1';

export type ProgressionState = {
  coins: number;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  collection: CollectionState;
  upgrades: UpgradeLevels;
  attempts: number;
  catches: number;
};

export type Reward = {
  success: boolean;
  coins: number;
  xp: number;
  collectibleId?: string;
  score?: number;
};

const initialState: ProgressionState = {
  coins: 25,
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  dailyStreak: 1,
  lastPlayedDate: null,
  collection: {},
  upgrades: {},
  attempts: 0,
  catches: 0,
};

export const xpForLevel = (level: number) => 100 + (level - 1) * 60;

function normalizeLevel(state: ProgressionState) {
  let { level, xp } = state;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
  return { ...state, level, xp };
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousDateKey() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return dateKey(date);
}

function applyDailyStreak(state: ProgressionState): ProgressionState {
  const today = dateKey();
  if (state.lastPlayedDate === today) return state;
  return {
    ...state,
    dailyStreak: state.lastPlayedDate === previousDateKey() ? state.dailyStreak + 1 : 1,
    lastPlayedDate: today,
  };
}

type Action =
  | { type: 'HYDRATE'; state: ProgressionState }
  | { type: 'REWARD'; reward: Reward }
  | { type: 'BUY'; upgrade: UpgradeDefinition };

function reducer(state: ProgressionState, action: Action): ProgressionState {
  if (action.type === 'HYDRATE') return applyDailyStreak({ ...initialState, ...action.state });
  if (action.type === 'BUY') {
    const result = purchaseUpgrade(action.upgrade, state.upgrades, state.coins);
    return { ...state, coins: result.coins, upgrades: result.levels };
  }

  const { reward } = action;
  const streak = reward.success ? state.streak + 1 : 0;
  const next = applyDailyStreak({
    ...state,
    coins: state.coins + reward.coins,
    xp: state.xp + reward.xp,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    attempts: state.attempts + 1,
    catches: state.catches + (reward.success ? 1 : 0),
    collection:
      reward.success && reward.collectibleId
        ? addToCollection(state.collection, reward.collectibleId, reward.score ?? 0)
        : state.collection,
  });
  return normalizeLevel(next);
}

type ProgressionContextValue = {
  state: ProgressionState;
  hydrated: boolean;
  award: (reward: Reward) => void;
  buy: (upgrade: UpgradeDefinition) => void;
};

const ProgressionContext = createContext<ProgressionContextValue | null>(null);

export function ProgressionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) dispatch({ type: 'HYDRATE', state: JSON.parse(value) as ProgressionState });
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [hydrated, state]);

  const award = useCallback((reward: Reward) => dispatch({ type: 'REWARD', reward }), []);
  const buy = useCallback((upgrade: UpgradeDefinition) => dispatch({ type: 'BUY', upgrade }), []);
  const value = useMemo(() => ({ state, hydrated, award, buy }), [state, hydrated, award, buy]);

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>;
}

export function useProgression() {
  const context = useContext(ProgressionContext);
  if (!context) throw new Error('useProgression must be used inside ProgressionProvider');
  return context;
}
