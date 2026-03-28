import { GetCombatant, killAndCopy, addItemToBoard, MIN_HEALTH, MAX_YOUNGLING_TICK, initCombatantStartingPos, updateCombatantsPositionsAfterResize } from '../../data/utils/CombatantUtils';
import { Combatants, Items, TILE_START } from '../../data/slices/boardSlice';
import { State, Character, DecisionType, Gender, Strength } from '../../models/CombatantModel';
import { DEFAULT } from '../../models/GlobalCombatantStatsModel';
import Player from '../../objects/combatants/Player';
import NPC from '../../objects/combatants/NPC';
import { Type as ItemType, DEFAULT_ITEM, ItemState } from '../../objects/items/Item';
import { createTileModel, Type as TileType } from '../../models/TileModel';
import { makeCombatantModel } from '../helpers/testFactories';

const makeTiles = () => ({
  width: 5,
  height: 5,
  start: TILE_START,
  end: TILE_START + 24,
  size: 25,
  t: Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      TILE_START + i,
      { index: TILE_START + i, type: 'Grass', score_potential: {} },
    ])
  ),
});

describe('GetCombatant', () => {
  it('returns undefined for undefined model', () => {
    expect(GetCombatant(undefined)).toBeUndefined();
  });

  it('returns Player for is_player model', () => {
    const c = GetCombatant({ is_player: true, position: TILE_START });
    expect(c).toBeInstanceOf(Player);
  });

  it('returns NPC for position-only model', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c).toBeInstanceOf(NPC);
  });

  it('throws for unrecognized model', () => {
    expect(() => GetCombatant({} as any)).toThrow();
  });
});

describe('killAndCopy', () => {
  it('removes specified positions', () => {
    const combatants: Combatants = {
      size: 2,
      c: {
        [TILE_START]: { id: 'a', position: TILE_START } as any,
        [TILE_START + 1]: { id: 'b', position: TILE_START + 1 } as any,
      },
    };
    const result = killAndCopy({ positions: [TILE_START], combatants });
    expect(result.c[TILE_START]).toBeUndefined();
    expect(result.c[TILE_START + 1]).toBeDefined();
    expect(result.size).toBe(1);
  });

  it('returns empty combatants when all removed', () => {
    const combatants: Combatants = {
      size: 1,
      c: { [TILE_START]: { id: 'a', position: TILE_START } as any },
    };
    const result = killAndCopy({ positions: [TILE_START], combatants });
    expect(result.size).toBe(0);
  });
});

describe('addItemToBoard', () => {
  it('adds item to empty tile', () => {
    const items: Items = { size: 0, i: {} };
    const item = { getPosition: () => TILE_START, toModel: () => ({ ...DEFAULT_ITEM, position: TILE_START, type: ItemType.Bomb, state: ItemState.Live }) } as any;
    addItemToBoard(item, items);
    expect(items.i[TILE_START]).toHaveLength(1);
    expect(items.size).toBe(1);
  });

  it('caps at MAX_TILE_ITEM_COUNT (4) by shifting oldest', () => {
    const items: Items = { size: 4, i: { [TILE_START]: [] } };
    for (let i = 0; i < 4; i++) {
      items.i[TILE_START].push({ ...DEFAULT_ITEM, id: `item_${i}`, position: TILE_START, type: ItemType.Bomb, state: ItemState.Live });
    }
    const newItem = { getPosition: () => TILE_START, toModel: () => ({ ...DEFAULT_ITEM, id: 'new', position: TILE_START, type: ItemType.MedPack, state: ItemState.Live }) } as any;
    addItemToBoard(newItem, items);
    expect(items.i[TILE_START]).toHaveLength(4);
    expect(items.i[TILE_START][3].id).toBe('new');
  });
});

describe('Combatant object', () => {
  it('starts alive', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c!.getState()).toBe(State.Alive);
    expect(c!.isDead()).toBe(false);
  });

  it('kill sets state to Dead', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.kill();
    expect(c!.isDead()).toBe(true);
  });

  it('affectFitness kills when below MIN_HEALTH', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.affectFitness(MIN_HEALTH - 1);
    expect(c!.isDead()).toBe(true);
  });

  it('fightWith - higher fitness wins', () => {
    const winner = GetCombatant({ position: TILE_START, fitness: 100 });
    const loser = GetCombatant({ position: TILE_START + 1, fitness: 0 });
    const result = winner!.fightWith(loser!);
    expect(result.getID()).toBe(winner!.getID());
    expect(loser!.isDead()).toBe(true);
  });

  it('fightWith - lower fitness loses', () => {
    const weak = GetCombatant({ position: TILE_START, fitness: 0 });
    const strong = GetCombatant({ position: TILE_START + 1, fitness: 100 });
    const result = weak!.fightWith(strong!);
    expect(result.getID()).toBe(strong!.getID());
    expect(weak!.isDead()).toBe(true);
  });

  it('tick increments age', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c!.getAge()).toBe(0);
    c!.tick();
    expect(c!.getAge()).toBe(1);
  });

  it('isYoung returns false when age <= MAX_YOUNGLING_TICK', () => {
    const c = GetCombatant({ position: TILE_START, tick: 0 });
    // isYoung returns getAge() > MAX_YOUNGLING_TICK
    expect(c!.isYoung()).toBe(false);
  });

  it('isYoung returns true when age > MAX_YOUNGLING_TICK', () => {
    const c = GetCombatant({ position: TILE_START, tick: MAX_YOUNGLING_TICK + 1 });
    expect(c!.isYoung()).toBe(true);
  });

  it('capture sets state to Captured and position to -1', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.capture();
    expect(c!.isCaptured()).toBe(true);
    expect(c!.getPosition()).toBe(-1);
  });

  it('setImmortal makes getFitness return Infinity', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.setImmortal(true, DEFAULT);
    expect(c!.getFitness()).toBe(Infinity);
    expect(c!.isImmortal()).toBe(true);
  });
});

describe('initCombatantStartingPos', () => {
  const makeGrassTilesLocal = (width = 5, height = 5) => {
    const tiles = {
      width,
      height,
      start: TILE_START,
      end: TILE_START + width * height - 1,
      size: width * height,
      t: {} as { [pos: number]: any },
    };
    for (let i = 0; i < width * height; i++) {
      tiles.t[TILE_START + i] = createTileModel({ index: TILE_START + i, type: TileType.Grass });
    }
    return tiles;
  };

  it('returns a valid position on a non-void tile', () => {
    const tiles = makeGrassTilesLocal(5, 5);
    const combatants: Combatants = { size: 0, c: {} };
    const pos = initCombatantStartingPos({ tiles, player: undefined, combatants });
    expect(pos).toBeGreaterThanOrEqual(tiles.start);
    expect(pos).toBeLessThanOrEqual(tiles.end);
    expect(tiles.t[pos].type).not.toBe(TileType.Void);
  });

  it('avoids occupied tiles', () => {
    // Create a 1x3 grid so positions are very constrained
    const tiles = makeGrassTilesLocal(3, 1);
    // Occupy first two positions
    const combatants: Combatants = {
      size: 2,
      c: {
        [TILE_START]: makeCombatantModel({ position: TILE_START }),
        [TILE_START + 1]: makeCombatantModel({ position: TILE_START + 1 }),
      },
    };
    // Only TILE_START+2 is free; run multiple times to confirm
    for (let i = 0; i < 20; i++) {
      const pos = initCombatantStartingPos({ tiles, player: undefined, combatants });
      if (pos !== -1) {
        expect(combatants.c[pos]).toBeUndefined();
      }
    }
  });

  it('avoids player position', () => {
    const tiles = makeGrassTilesLocal(1, 2);
    // Occupy one tile with a combatant, the other with the player
    const playerPos = TILE_START;
    const player = new Player({ position: playerPos, is_player: true });
    const combatants: Combatants = {
      size: 1,
      c: {
        [TILE_START + 1]: makeCombatantModel({ position: TILE_START + 1 }),
      },
    };
    // Both positions taken (player + combatant), should return -1
    const pos = initCombatantStartingPos({ tiles, player, combatants });
    expect(pos).toBe(-1);
  });

  it('returns -1 when no valid position found (all tiles void or occupied)', () => {
    // Create a small grid where all tiles are Void
    const tiles = {
      width: 2,
      height: 2,
      start: TILE_START,
      end: TILE_START + 3,
      size: 4,
      t: {} as { [pos: number]: any },
    };
    for (let i = 0; i < 4; i++) {
      tiles.t[TILE_START + i] = createTileModel({ index: TILE_START + i, type: TileType.Void });
    }
    const combatants: Combatants = { size: 0, c: {} };
    const pos = initCombatantStartingPos({ tiles, player: undefined, combatants });
    expect(pos).toBe(-1);
  });
});

describe('updateCombatantsPositionsAfterResize', () => {
  const makeGrassTilesLocal = (width: number, height: number) => {
    const tiles = {
      width,
      height,
      start: TILE_START,
      end: TILE_START + width * height - 1,
      size: width * height,
      t: {} as { [pos: number]: any },
    };
    for (let i = 0; i < width * height; i++) {
      tiles.t[TILE_START + i] = createTileModel({ index: TILE_START + i, type: TileType.Grass });
    }
    return tiles;
  };

  it('translates coordinates correctly when width increases by 1', () => {
    // Old: 3x3 grid, combatant at row 1, col 1 (position TILE_START + 4)
    const old_width = 3;
    const new_tiles = makeGrassTilesLocal(4, 3); // width 3 -> 4
    const oldPos = TILE_START + 4; // row=1, col=1 in 3-wide grid
    const combatants: Combatants = {
      size: 1,
      c: { [oldPos]: makeCombatantModel({ position: oldPos }) },
    };

    const result = updateCombatantsPositionsAfterResize({
      combatants,
      old_window_width: old_width,
      tiles: new_tiles,
    });

    // row=1, col=1 in 4-wide grid => TILE_START + 1*4 + 1 = TILE_START + 5
    const expectedPos = TILE_START + 5;
    expect(result.combatants.c[expectedPos]).toBeDefined();
    expect(result.combatants.c[expectedPos].position).toBe(expectedPos);
    expect(result.combatants.size).toBe(1);
    expect(result.deaths).toBe(0);
  });

  it('translates coordinates correctly when width decreases by 1', () => {
    // Old: 4x3 grid, combatant at row 2, col 1 (position TILE_START + 9)
    const old_width = 4;
    const new_tiles = makeGrassTilesLocal(3, 3); // width 4 -> 3
    const oldPos = TILE_START + 9; // row=2, col=1 in 4-wide grid
    const combatants: Combatants = {
      size: 1,
      c: { [oldPos]: makeCombatantModel({ position: oldPos }) },
    };

    const result = updateCombatantsPositionsAfterResize({
      combatants,
      old_window_width: old_width,
      tiles: new_tiles,
    });

    // row=2, col=1 in 3-wide grid => TILE_START + 2*3 + 1 = TILE_START + 7
    const expectedPos = TILE_START + 7;
    expect(result.combatants.c[expectedPos]).toBeDefined();
    expect(result.combatants.c[expectedPos].position).toBe(expectedPos);
    expect(result.combatants.size).toBe(1);
    expect(result.deaths).toBe(0);
  });

  it('counts deaths for combatants on invalid positions after resize', () => {
    // Old: 4x3 grid, combatant at row 2, col 3 (last col, position TILE_START + 11)
    // New: 2x2 grid — that position is out of bounds
    const old_width = 4;
    const new_tiles = makeGrassTilesLocal(2, 2);
    // Make all new tiles Void so any translated position is invalid
    for (const key in new_tiles.t) {
      new_tiles.t[key] = createTileModel({ index: parseInt(key), type: TileType.Void });
    }
    const oldPos = TILE_START + 11; // row=2, col=3 in 4-wide grid
    const combatants: Combatants = {
      size: 1,
      c: { [oldPos]: makeCombatantModel({ position: oldPos }) },
    };

    const result = updateCombatantsPositionsAfterResize({
      combatants,
      old_window_width: old_width,
      tiles: new_tiles,
    });

    expect(result.deaths).toBe(1);
    expect(result.combatants.size).toBe(0);
  });

  it('handles fight when two combatants land on same position', () => {
    // Old: 3x2 grid, two combatants at different positions that map to same new position
    // Combatant A at row 0, col 0 (TILE_START + 0) — strong
    // Combatant B at row 1, col 0 (TILE_START + 3) — weak
    // New: 2x1 grid — both map to col 0
    // A: row=0, col=0 => new pos = 0*2 + 0 + TILE_START = TILE_START
    // B: row=1, col=0 => row >= height(1), so row-- => row=0, new pos = 0*2 + 0 + TILE_START = TILE_START
    const old_width = 3;
    const new_tiles = makeGrassTilesLocal(2, 1);
    const posA = TILE_START;     // row=0, col=0
    const posB = TILE_START + 3; // row=1, col=0

    const combatants: Combatants = {
      size: 2,
      c: {
        [posA]: makeCombatantModel({ position: posA, fitness: 100 }),
        [posB]: makeCombatantModel({ position: posB, fitness: 0 }),
      },
    };

    const result = updateCombatantsPositionsAfterResize({
      combatants,
      old_window_width: old_width,
      tiles: new_tiles,
    });

    // Both land on TILE_START, one dies in fight
    expect(result.deaths).toBe(1);
    expect(result.combatants.size).toBe(2); // size increments per combatant processed
    expect(result.combatants.c[TILE_START]).toBeDefined();
  });
});
