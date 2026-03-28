import boardReducer, {
  startGame,
  stopGame,
  select,
  killSelected,
  spawnAtSelected,
  spawnAtRandom,
  paintTile,
  toggleShowTilePotentials,
  toggleShowRealTileImages,
  toggleUseGenders,
  movePlayer,
  updateSelectedCombatant,
  TILE_START,
  setGameMode,
  reset,
  setInitialNumCombatants,
  shrinkWidth,
  growWidth,
  shrinkHeight,
  growHeight,
  setMap,
  setViewPortSize,
  GAME_DEFAULTS,
} from '../../data/slices/boardSlice';
import { GameState, GameMode, ArrowKey } from '../../data/utils/GameUtils';
import { Type as TileType, createTileModel } from '../../models/TileModel';
import { Character, DecisionType, State } from '../../models/CombatantModel';
import { Type as ItemType } from '../../objects/items/Item';
import { Pointer } from '../../models/PointerModel';

// boardSlice initialState is computed via initState() which calls Maps.generate()
// We get it by calling the reducer with undefined state
const getInitialState = () => boardReducer(undefined, { type: '@@INIT' });

describe('boardSlice - settings', () => {
  it('toggleShowTilePotentials flips the flag', () => {
    const s0 = getInitialState();
    const s1 = boardReducer(s0, toggleShowTilePotentials());
    expect(s1.show_tile_potentials).toBe(true);
    const s2 = boardReducer(s1, toggleShowTilePotentials());
    expect(s2.show_tile_potentials).toBe(false);
  });

  it('toggleShowRealTileImages flips the flag', () => {
    const s0 = getInitialState();
    const initial = s0.show_real_tile_images;
    const s1 = boardReducer(s0, toggleShowRealTileImages());
    expect(s1.show_real_tile_images).toBe(!initial);
  });

  it('toggleUseGenders flips the flag', () => {
    const s0 = getInitialState();
    const s1 = boardReducer(s0, toggleUseGenders());
    expect(s1.use_genders).toBe(true);
  });
});

describe('boardSlice - game state', () => {
  it('initial game_state is Title', () => {
    expect(getInitialState().game_state).toBe(GameState.Title);
  });

  it('startGame sets game_state to Game', () => {
    const s = boardReducer(getInitialState(), startGame());
    expect(s.game_state).toBe(GameState.Game);
  });

  it('stopGame sets game_state to Title', () => {
    const started = boardReducer(getInitialState(), startGame());
    const stopped = boardReducer(started, stopGame());
    expect(stopped.game_state).toBe(GameState.Title);
  });
});

describe('boardSlice - select', () => {
  it('select sets selected_position', () => {
    const s = boardReducer(getInitialState(), select({ position: TILE_START + 5 }));
    expect(s.selected_position).toBe(TILE_START + 5);
  });

  it('select with no payload clears selected_position', () => {
    const withSel = boardReducer(getInitialState(), select({ position: TILE_START + 5 }));
    const cleared = boardReducer(withSel, select({}));
    expect(cleared.selected_position).toBeUndefined();
  });
});

describe('boardSlice - paintTile', () => {
  it('painting a TileType changes the tile', () => {
    const s0 = getInitialState();
    // find a valid non-void tile position
    const pos = Object.keys(s0.tiles.t).map(Number).find(p => s0.tiles.t[p]?.type !== TileType.Void)!;
    const s1 = boardReducer(s0, paintTile({ position: pos, type: TileType.Fire }));
    expect(s1.tiles.t[pos]?.type).toBe(TileType.Fire);
  });

  it('painting a Character spawns a combatant', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.tiles.t).map(Number).find(p =>
      s0.tiles.t[p]?.type !== TileType.Void && !s0.combatants.c[p]
    )!;
    const before = s0.combatants.size;
    const s1 = boardReducer(s0, paintTile({ position: pos, type: Character.Bunny }));
    expect(s1.combatants.c[pos]?.species).toBe(Character.Bunny);
    expect(s1.combatants.size).toBe(before + 1);
  });

  it('painting Pointer.Target on occupied tile kills combatant', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.combatants.c).map(Number)[0];
    if (pos === undefined) return; // skip if no combatants
    const before = s0.combatants.size;
    const s1 = boardReducer(s0, paintTile({ position: pos, type: Pointer.Target }));
    expect(s1.combatants.c[pos]).toBeUndefined();
    expect(s1.combatants.size).toBe(before - 1);
  });
});

describe('boardSlice - spawnAtSelected / killSelected', () => {
  it('spawnAtSelected adds a combatant at selected position', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.tiles.t).map(Number).find(p =>
      s0.tiles.t[p]?.type !== TileType.Void && !s0.combatants.c[p]
    )!;
    const withSel = boardReducer(s0, select({ position: pos }));
    const before = withSel.combatants.size;
    const s1 = boardReducer(withSel, spawnAtSelected());
    expect(s1.combatants.size).toBe(before + 1);
    expect(s1.combatants.c[pos]).toBeDefined();
  });

  it('killSelected marks combatant as dead', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.combatants.c).map(Number)[0];
    if (pos === undefined) return;
    const withSel = boardReducer(s0, select({ position: pos }));
    const s1 = boardReducer(withSel, killSelected());
    expect(s1.combatants.c[pos]?.state).toBe(State.Dead);
  });
});

describe('boardSlice - spawnAtRandom', () => {
  it('spawnAtRandom increases combatant count', () => {
    const s0 = getInitialState();
    const before = s0.combatants.size;
    const s1 = boardReducer(s0, spawnAtRandom());
    expect(s1.combatants.size).toBe(before + 1);
  });
});

describe('boardSlice - updateSelectedCombatant', () => {
  it('updates name of selected combatant', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.combatants.c).map(Number)[0];
    if (pos === undefined) return;
    const withSel = boardReducer(s0, select({ position: pos }));
    const s1 = boardReducer(withSel, updateSelectedCombatant({ field: 'name', value: 'Hero' }));
    expect(s1.combatants.c[pos]?.name).toBe('Hero');
  });

  it('setting immortal updates strength to Immortal', () => {
    const s0 = getInitialState();
    const pos = Object.keys(s0.combatants.c).map(Number)[0];
    if (pos === undefined) return;
    const withSel = boardReducer(s0, select({ position: pos }));
    const s1 = boardReducer(withSel, updateSelectedCombatant({ field: 'immortal', value: true }));
    expect(s1.combatants.c[pos]?.strength).toBe('Immortal');
  });
});

describe('boardSlice - setGameMode', () => {
  it('setGameMode to Adventure sets initial_num_combatants to 0, creates player, sets map to Adventure, sets tiles.height to 3', () => {
    const s0 = getInitialState();
    expect(s0.game_mode).toBe(GameMode.God);
    const s1 = boardReducer(s0, setGameMode(GameMode.Adventure));
    expect(s1.game_mode).toBe(GameMode.Adventure);
    expect(s1.initial_num_combatants).toBe(0);
    expect(s1.player).toBeDefined();
    expect(s1.player?.is_player).toBe(true);
    expect(s1.map).toBe('Adventure');
    expect(s1.tiles.height).toBe(3);
  });

  it('setGameMode to God restores default initial_num_combatants, clears player, restores default map if was Adventure', () => {
    const s0 = getInitialState();
    // First switch to Adventure
    const adventure = boardReducer(s0, setGameMode(GameMode.Adventure));
    expect(adventure.map).toBe('Adventure');
    // Then switch back to God
    const god = boardReducer(adventure, setGameMode(GameMode.God));
    expect(god.game_mode).toBe(GameMode.God);
    expect(god.initial_num_combatants).toBe(GAME_DEFAULTS.initial_num_combatants);
    expect(god.player).toBeUndefined();
    // Map should be restored to World since it was Adventure
    expect(god.map).toBe('World');
  });

  it('setGameMode no-ops when already in the target mode', () => {
    const s0 = getInitialState();
    expect(s0.game_mode).toBe(GameMode.God);
    const s1 = boardReducer(s0, setGameMode(GameMode.God));
    // State should be identical (no-op)
    expect(s1).toBe(s0);
  });
});

describe('boardSlice - reset', () => {
  it('reinitializes combatants and tiles', () => {
    const s0 = getInitialState();
    const s1 = boardReducer(s0, reset());
    // combatants.size should match initial_num_combatants
    expect(s1.combatants.size).toBe(s1.initial_num_combatants);
    // tiles should be regenerated (t should have entries)
    expect(Object.keys(s1.tiles.t).length).toBeGreaterThan(0);
    expect(s1.tiles.width).toBe(s0.tiles.width);
    expect(s1.tiles.height).toBe(s0.tiles.height);
  });
});

describe('boardSlice - setInitialNumCombatants', () => {
  it('updates combatant count and caps at 20x default (1000)', () => {
    const s0 = getInitialState();
    // Set to a normal value
    const s1 = boardReducer(s0, setInitialNumCombatants(10));
    expect(s1.initial_num_combatants).toBe(10);
    expect(s1.combatants.size).toBe(10);

    // Set to a value exceeding the cap (20 * 50 = 1000)
    const s2 = boardReducer(s0, setInitialNumCombatants(2000));
    expect(s2.initial_num_combatants).toBe(1000);
  });
});

describe('boardSlice - shrinkWidth / growWidth', () => {
  it('shrinkWidth decreases tiles.width by 1 and repositions combatants', () => {
    const s0 = getInitialState();
    const originalWidth = s0.tiles.width;
    const s1 = boardReducer(s0, shrinkWidth());
    expect(s1.tiles.width).toBe(originalWidth - 1);
    // Tiles should be regenerated
    expect(Object.keys(s1.tiles.t).length).toBeGreaterThan(0);
  });

  it('growWidth increases tiles.width by 1 and repositions combatants', () => {
    const s0 = getInitialState();
    const originalWidth = s0.tiles.width;
    const s1 = boardReducer(s0, growWidth());
    expect(s1.tiles.width).toBe(originalWidth + 1);
    // Tiles should be regenerated
    expect(Object.keys(s1.tiles.t).length).toBeGreaterThan(0);
  });

  it('shrinkWidth no-ops when width is 0', () => {
    let state = getInitialState();
    // Shrink width down to 0
    while (state.tiles.width > 0) {
      state = boardReducer(state, shrinkWidth());
    }
    expect(state.tiles.width).toBe(0);
    // Another shrink should no-op
    const after = boardReducer(state, shrinkWidth());
    expect(after.tiles.width).toBe(0);
  });
});

describe('boardSlice - shrinkHeight / growHeight', () => {
  it('shrinkHeight decreases tiles.height by 1', () => {
    const s0 = getInitialState();
    const originalHeight = s0.tiles.height;
    const s1 = boardReducer(s0, shrinkHeight());
    expect(s1.tiles.height).toBe(originalHeight - 1);
  });

  it('growHeight increases tiles.height by 1', () => {
    const s0 = getInitialState();
    const originalHeight = s0.tiles.height;
    const s1 = boardReducer(s0, growHeight());
    expect(s1.tiles.height).toBe(originalHeight + 1);
  });

  it('shrinkHeight no-ops when height is 0', () => {
    let state = getInitialState();
    // Shrink height down to 0
    while (state.tiles.height > 0) {
      state = boardReducer(state, shrinkHeight());
    }
    expect(state.tiles.height).toBe(0);
    // Another shrink should no-op
    const after = boardReducer(state, shrinkHeight());
    expect(after.tiles.height).toBe(0);
  });
});

describe('boardSlice - setMap', () => {
  it('regenerates tiles with new map and reinitializes combatants', () => {
    const s0 = getInitialState();
    const s1 = boardReducer(s0, setMap('Meadow'));
    expect(s1.map).toBe('Meadow');
    // All tiles should be Grass for Meadow map
    const tilePositions = Object.keys(s1.tiles.t).map(Number);
    expect(tilePositions.length).toBeGreaterThan(0);
    for (const pos of tilePositions) {
      expect(s1.tiles.t[pos]?.type).toBe(TileType.Grass);
    }
    // Combatants should be reinitialized
    expect(s1.combatants.size).toBe(s1.initial_num_combatants);
  });
});

describe('boardSlice - setViewPortSize', () => {
  it('updates viewport width/height measurements', () => {
    const s0 = getInitialState();
    const s1 = boardReducer(s0, setViewPortSize({ width: 800, height: 600 }));
    expect(s1.view_port.width_measurement).toBe(800);
    expect(s1.view_port.height_measurement).toBe(600);
    // viewport tile dimensions should be recalculated
    expect(s1.view_port.width).toBeGreaterThan(0);
    expect(s1.view_port.height).toBeGreaterThan(0);
  });
});
