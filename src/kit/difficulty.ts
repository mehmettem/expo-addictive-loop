export type DifficultyCurve = {
  speed: number;
  targetWidth: number;
  rewardMultiplier: number;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Smoothly raises challenge while keeping the game readable on small screens. */
export function difficultyForLevel(level: number): DifficultyCurve {
  const step = clamp(level - 1, 0, 30);
  return {
    speed: 1 + Math.log2(step + 1) * 0.22,
    targetWidth: clamp(0.28 - step * 0.007, 0.11, 0.28),
    rewardMultiplier: 1 + step * 0.08,
  };
}

/** 0 at the edge, 1 at the center of the target zone. */
export function accuracyScore(position: number, targetCenter: number, targetWidth: number) {
  const distance = Math.abs(position - targetCenter);
  return clamp(1 - distance / (targetWidth / 2), 0, 1);
}

/** Seed-friendly weighted pick for deterministic tests or daily challenges. */
export function weightedPick<T extends { weight: number }>(items: readonly T[], roll = Math.random()) {
  if (!items.length) throw new Error('weightedPick requires at least one item');
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  let cursor = roll * total;
  for (const item of items) {
    cursor -= Math.max(0, item.weight);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1] as T;
}
