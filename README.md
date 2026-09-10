# 🎣 Expo Addictive Loop

> A polished Expo + TypeScript starter for building tiny games that are impossible to put down.

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Expo Go](https://img.shields.io/badge/Expo%20Go-iOS%20%2B%20Android-4630EB)](https://expo.dev/go)
[![MIT License](https://img.shields.io/badge/license-MIT-53B9FF.svg)](LICENSE)

**Clone it, reskin it, and ship a satisfying mobile mini-game in a weekend.** Addictive Loop is not a finished commercial game: it is a reusable game-loop kit plus **Tideline**, a juicy portrait fishing demo that runs in Expo Go.

```text
      TAP TO CAST       HIT THE ZONE       GET THE CATCH       ONE MORE GO
          🎣       →     [==▌=██==]    →      🐡 +12      →    ↻ < 1 second
       intent              skill              reward             replay
```

The demo opens directly into play—no login, tutorial wall, or menu. It includes timing-based catches, haptics, particles, screen shake, six collectible creatures, rarity tiers, XP, streaks, persistent progression, and an upgrade shop.

## Try it

```bash
git clone https://github.com/mehmettem/expo-addictive-loop.git
cd expo-addictive-loop
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on iOS or Android. Tap **CAST THE LINE**, then tap **HOOK!** while the white marker is inside the green zone.

> **Demo GIF wanted:** run the app in Expo Go, record a 10–15 second cast → catch → upgrade loop with your phone's screen recorder, crop it to portrait, and save it as `docs/tideline-demo.gif`. The diagram above remains a lightweight preview until a recording is added.

## What is in the kit?

Everything reusable lives under [`src/kit`](src/kit), with no references to fish, oceans, or demo content.

- **Game loop state machine** — guarded `ready → intent → challenge → outcome → replay` transitions
- **Persistent progression** — coins, XP, levels, run streaks, daily streaks, stats, collection, and upgrades; automatically hydrated with AsyncStorage
- **Collection primitives** — weighted drops, level gates, rarity metadata, duplicate counts, and personal bests
- **Upgrade shop** — exponential pricing, purchase validation, caps, and composable effects
- **Juice toolkit** — Expo haptics, animated particle bursts, a screen-shake hook, and a swappable SFX interface
- **Difficulty helpers** — smooth level curves, precision scoring, clamping, and deterministic-friendly weighted picks
- **Tideline demo** — a complete, safe-area-friendly portrait game with large touch targets and no custom native modules

## Project structure

```text
.
├── App.tsx                    # Provider + demo entry point
├── src/
│   ├── kit/
│   │   ├── game-loop.ts       # Scene state machine and hook
│   │   ├── progression.tsx    # Persistent progression provider
│   │   ├── collection.ts      # Rarity and weighted-drop helpers
│   │   ├── shop.ts            # Upgrade economy primitives
│   │   ├── feedback.tsx       # Haptics, particles, shake, SFX port
│   │   └── difficulty.ts      # Tunable challenge curves
│   └── demo/
│       ├── GameScreen.tsx     # Tideline presentation and gameplay
│       └── content.ts         # Fish and upgrade configuration
├── app.json
└── tsconfig.json
```

## Build your game on the kit

1. **Define the content.** Replace `src/demo/content.ts` with cards, gems, monsters, recipes, or anything collectible. Keep presentation data outside the kit.
2. **Model one fast attempt.** Use `useGameLoop<Result>()`, call `BEGIN`, `CHALLENGE`, and `RESOLVE`, then expose `REPLAY` immediately. Keep the first action one tap away.
3. **Tune skill, not frustration.** Feed the player's level into `difficultyForLevel()`. Widen or slow the target with upgrades instead of hard-coding special cases.
4. **Reward every attempt.** Call `award()` from `useProgression()` for success and failure. A miss can still grant a little XP.
5. **Add feel.** Trigger `feedback.tap/success/miss`, render `ParticleBurst`, and call `useScreenShake().shake()` at the moment of impact.
6. **Reskin freely.** Replace only `src/demo`; import public primitives from `src/kit/index.ts`.

The progression provider persists automatically. For production, change `STORAGE_KEY` in `progression.tsx` when you make a breaking save-data change.

## Useful commands

```bash
npm start             # Start Expo dev server
npm run android       # Open on Android
npm run ios           # Open on iOS (macOS)
npm run typecheck     # Strict TypeScript validation
npm run doctor        # Expo project health checks
```

## Design principles

- The player should understand the first action without reading.
- Skill feedback should be immediate and legible.
- Outcome animation must never delay replay.
- Progression should create goals, not punish missed days.
- Theme belongs to the game; mechanics belong to the kit.

## Contributing

Small, focused improvements and new demo themes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE) © 2026 Mehmet Tem
