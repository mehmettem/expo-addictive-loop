import { Collectible, UpgradeDefinition } from '../kit';

export const FISH: readonly Collectible[] = [
  { id: 'sprat', name: 'Silver Sprat', emoji: '🐟', rarity: 'common', minLevel: 1, weight: 55, value: 8 },
  { id: 'puffer', name: 'Puffer Pal', emoji: '🐡', rarity: 'common', minLevel: 1, weight: 28, value: 12 },
  { id: 'tuna', name: 'Neon Tuna', emoji: '🐠', rarity: 'rare', minLevel: 2, weight: 12, value: 24 },
  { id: 'squid', name: 'Moon Squid', emoji: '🦑', rarity: 'rare', minLevel: 3, weight: 8, value: 32 },
  { id: 'shark', name: 'Tiny Titan', emoji: '🦈', rarity: 'epic', minLevel: 5, weight: 3, value: 65 },
  { id: 'whale', name: 'Star Whale', emoji: '🐋', rarity: 'legendary', minLevel: 8, weight: 0.7, value: 150 },
];

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: 'rod',
    name: 'Tidal Rod',
    description: 'Widens the catch zone by 5%',
    emoji: '🎣',
    basePrice: 35,
    maxLevel: 5,
  },
  {
    id: 'lure',
    name: 'Lucky Lure',
    description: 'Improves rare catch odds by 20%',
    emoji: '✨',
    basePrice: 50,
    maxLevel: 5,
  },
  {
    id: 'reel',
    name: 'Swift Reel',
    description: 'Adds 10% to every coin reward',
    emoji: '⚙️',
    basePrice: 65,
    maxLevel: 5,
  },
];
