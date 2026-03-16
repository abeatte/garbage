/**
 * Integration tests: Redux store + game loop (tick) behavior
 */
import { configureStore } from '@reduxjs/toolkit';
import boardReducer, {
  startGame,
  tick as boardTick,
  select,
  spawnAtSelected,
  killSelected,
  TILE_START,
} from '../../data/slices/boardSlice';
import tickerReducer, { tick as tickerTick } from '../../data/slices/tickerSlice';
import hudReducer from '../../data/slices/hudSlice';
import paintPaletteReducer from '../../data/slices/paintPaletteSlice';
import { GameState } from '../../data/utils/GameUtils';
import { Type as TileType } from '../../models/TileModel';
import { State } from '../../models/CombatantModel';

const makeStore = () =>
  configureStore({
    reducer: {
      ticker: tickerReducer,
      board: boardReducer,
      hud: hudReducer,
      paintPalette: paintPaletteReducer,
    },
  });

describe('Game loop integration', () => {
  it('startGame transitions to Game state', () => {
    const store = makeStore();
    expect(store.getState().board.game_state).toBe(GameState.Title);
    store.dispatch(startGame());
    expect(store.getState().board.game_state).toBe(GameState.Game);
  });

  it('ticker tick increments tick count', () => {
    const store = makeStore();
    store.dispatch(tickerTick());
    expect(store.getState().ticker.tick).toBe(1);
  });

  it('board tick processes without error', () => {
    const store = makeStore();
    store.dispatch(startGame());
    expect(() => store.dispatch(boardTick())).not.toThrow();
  });

  it('multiple board ticks do not corrupt combatant state', () => {
    const store = makeStore();
    store.dispatch(startGame());
    for (let i = 0; i < 5; i++) {
      store.dispatch(boardTick());
    }
    const { combatants } = store.getState().board;
    // All combatants in the map should have valid positions
    Object.values(combatants.c).forEach((c) => {
      expect(c.position).toBeGreaterThanOrEqual(TILE_START);
    });
  });

  it('spawning and killing a combatant updates size correctly', () => {
    const store = makeStore();
    store.dispatch(startGame());

    const state = store.getState().board;
    const emptyPos = Object.keys(state.tiles.t)
      .map(Number)
      .find((p) => state.tiles.t[p]?.type !== TileType.Void && !state.combatants.c[p]);

    if (emptyPos === undefined) return; // skip if no empty tile found

    const before = store.getState().board.combatants.size;
    store.dispatch(select({ position: emptyPos }));
    store.dispatch(spawnAtSelected());
    expect(store.getState().board.combatants.size).toBe(before + 1);

    store.dispatch(killSelected());
    const killed = store.getState().board.combatants.c[emptyPos];
    expect(killed?.state).toBe(State.Dead);
  });

  it('board tick after kill removes dead combatant', () => {
    const store = makeStore();
    store.dispatch(startGame());

    const state = store.getState().board;
    const occupiedPos = Object.keys(state.combatants.c).map(Number)[0];
    if (occupiedPos === undefined) return;

    store.dispatch(select({ position: occupiedPos }));
    store.dispatch(killSelected());
    store.dispatch(boardTick());

    // After a tick, dead combatants should be cleaned up
    const afterTick = store.getState().board.combatants;
    const deadCount = Object.values(afterTick.c).filter((c) => c.state === State.Dead).length;
    expect(deadCount).toBe(0);
  });
});
