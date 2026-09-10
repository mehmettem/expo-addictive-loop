import { Dispatch, useCallback, useReducer } from 'react';

export type GameScene = 'ready' | 'intent' | 'challenge' | 'outcome';

export type GameLoopState<Result> = {
  scene: GameScene;
  attempt: number;
  result: Result | null;
};

export type GameLoopAction<Result> =
  | { type: 'BEGIN' }
  | { type: 'CHALLENGE' }
  | { type: 'RESOLVE'; result: Result }
  | { type: 'REPLAY' }
  | { type: 'RESET' };

export const initialGameLoopState = <Result,>(): GameLoopState<Result> => ({
  scene: 'ready',
  attempt: 0,
  result: null,
});

export function gameLoopReducer<Result>(
  state: GameLoopState<Result>,
  action: GameLoopAction<Result>,
): GameLoopState<Result> {
  switch (action.type) {
    case 'BEGIN':
      return state.scene === 'ready' ? { ...state, scene: 'intent', result: null } : state;
    case 'CHALLENGE':
      return state.scene === 'intent' ? { ...state, scene: 'challenge' } : state;
    case 'RESOLVE':
      return state.scene === 'challenge' ? { ...state, scene: 'outcome', result: action.result } : state;
    case 'REPLAY':
      return state.scene === 'outcome'
        ? { scene: 'ready', attempt: state.attempt + 1, result: null }
        : state;
    case 'RESET':
      return initialGameLoopState<Result>();
  }
}

export function useGameLoop<Result>() {
  const [state, dispatch] = useReducer(gameLoopReducer<Result>, initialGameLoopState<Result>());
  const send = useCallback((action: GameLoopAction<Result>) => dispatch(action), []);
  return { state, send } as { state: GameLoopState<Result>; send: Dispatch<GameLoopAction<Result>> };
}
