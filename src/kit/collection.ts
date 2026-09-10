import { weightedPick } from './difficulty';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type Collectible = {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  minLevel: number;
  weight: number;
  value: number;
};

export type CollectionEntry = { count: number; bestScore: number };
export type CollectionState = Record<string, CollectionEntry>;

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9DD9D2',
  rare: '#53B9FF',
  epic: '#B98CFF',
  legendary: '#FFD166',
};

export function availableCollectibles<T extends Collectible>(items: readonly T[], level: number) {
  return items.filter((item) => item.minLevel <= level);
}

export function drawCollectible<T extends Collectible>(
  items: readonly T[],
  level: number,
  luckMultiplier = 1,
): T {
  const available = availableCollectibles(items, level).map((item) => ({
    ...item,
    weight:
      item.rarity === 'common'
        ? item.weight
        : item.weight * Math.max(1, luckMultiplier),
  })) as T[];
  return weightedPick(available);
}

export function addToCollection(
  state: CollectionState,
  collectibleId: string,
  score: number,
): CollectionState {
  const current = state[collectibleId] ?? { count: 0, bestScore: 0 };
  return {
    ...state,
    [collectibleId]: {
      count: current.count + 1,
      bestScore: Math.max(current.bestScore, Math.round(score)),
    },
  };
}
