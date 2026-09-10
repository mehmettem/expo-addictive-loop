export type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  basePrice: number;
  maxLevel: number;
  priceGrowth?: number;
};

export type UpgradeLevels = Record<string, number>;

export function upgradePrice(upgrade: UpgradeDefinition, currentLevel: number) {
  return Math.round(upgrade.basePrice * Math.pow(upgrade.priceGrowth ?? 1.7, currentLevel));
}

export function canPurchase(upgrade: UpgradeDefinition, currentLevel: number, coins: number) {
  return currentLevel < upgrade.maxLevel && coins >= upgradePrice(upgrade, currentLevel);
}

export function upgradeEffect(level: number, effectPerLevel: number) {
  return 1 + level * effectPerLevel;
}

export function purchaseUpgrade(
  upgrade: UpgradeDefinition,
  levels: UpgradeLevels,
  coins: number,
): { levels: UpgradeLevels; coins: number; purchased: boolean } {
  const level = levels[upgrade.id] ?? 0;
  if (!canPurchase(upgrade, level, coins)) return { levels, coins, purchased: false };
  return {
    levels: { ...levels, [upgrade.id]: level + 1 },
    coins: coins - upgradePrice(upgrade, level),
    purchased: true,
  };
}
