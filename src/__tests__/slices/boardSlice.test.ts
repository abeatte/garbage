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
