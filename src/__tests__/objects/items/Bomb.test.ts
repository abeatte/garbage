// Import testFactories first to resolve circular dependency safely.
import {
  makeSight,
  emptyCombatants,
  emptyItems,
  makeGrassTiles,
  makeCombatantModel,
  makeItemModel,
} from '../../helpers/testFactories';
import { TILE_START, Combatants, Items } from '../../../data/slices/boardSlice';
import Bomb from '../../../objects/items/Bomb';
import { ItemState, Type, ItemType, SpiderType } from '../../../objects/items/Item';
import { State } from '../../../models/CombatantModel';
import { createTileModel, Type as TileType } from '../../../models/TileModel';
import { Surrounding } from '../../../data/utils/SightUtils';

describe('Bomb.IsOf', () => {
  it('returns true for { type: Type.Bomb }', () => {
    expect(Bomb.IsOf({ type: Type.Bomb })).toBe(true);
  });

  it('returns false for MedPack type', () => {
    expect(Bomb.IsOf({ type: Type.MedPack })).toBe(false);
  });

  it('returns false for PokemonBall type', () => {
    expect(Bomb.IsOf({ type: Type.PokemonBall })).toBe(false);
  });

  it('returns false for spider types', () => {
    expect(Bomb.IsOf({ type: SpiderType.FireSpider as ItemType })).toBe(false);
  });
});

describe('Bomb fuse_length', () => {
  it('is 3 for Bomb', () => {
    const model = makeItemModel(Type.Bomb);
    const bomb = new Bomb(model);
    expect(bomb.toModel().fuse_length).toBe(3);
  });
});

describe('Bomb.tap before fuse-up', () => {
  it('adds self to board via addItemToBoard and ticks', () => {
    const model = makeItemModel(Type.Bomb, { tick: 0, position: TILE_START });
    const bomb = new Bomb(model);
    const tiles = makeGrassTiles(5, 5);
    const sight = makeSight();
    const items = emptyItems();
    const combatants = emptyCombatants();

    bomb.tap(sight, items, combatants, tiles);

    // Item should have been added to the board
    expect(items.i[TILE_START]).toBeDefined();
    expect(items.i[TILE_START].length).toBe(1);
    expect(items.size).toBe(1);
    // Tick should have incremented
    expect(bomb.getAge()).toBe(1);
  });

  it('ticks each call but does not explode before fuse_length', () => {
    const model = makeItemModel(Type.Bomb, { tick: 0, position: TILE_START });
    const bomb = new Bomb(model);
    const tiles = makeGrassTiles(5, 5);
    const sight = makeSight();
    const items = emptyItems();
    const combatants = emptyCombatants();

    // Tap twice (tick 0 -> 1, then 1 -> 2), still below fuse_length of 3
    bomb.tap(sight, items, combatants, tiles);
    bomb.tap(sight, items, combatants, tiles);

    expect(bomb.getAge()).toBe(2);
    expect(bomb.isSpent()).toBe(false);
  });
});

describe('Bomb.tap on fuse-up (tick >= 3)', () => {
  it('kills surrounding combatants, clears surrounding items, marks self as Spent', () => {
    const bombPos = TILE_START + 6; // row 1, col 1 in 5x5 grid
    const model = makeItemModel(Type.Bomb, { tick: 3, position: bombPos });
    const bomb = new Bomb(model);
    const tiles = makeGrassTiles(5, 5);

    // Place combatants in surrounding positions
    const neighborPos1 = TILE_START + 7; // right of bomb
    const neighborPos2 = TILE_START + 1; // above bomb
    const combatants: Combatants = {
      size: 2,
      c: {
        [neighborPos1]: makeCombatantModel({ position: neighborPos1 }),
        [neighborPos2]: makeCombatantModel({ position: neighborPos2 }),
      },
    };

    // Place items in surrounding positions
    const items: Items = {
      size: 2,
      i: {
        [neighborPos1]: [makeItemModel(Type.MedPack, { position: neighborPos1 })],
        [neighborPos2]: [makeItemModel(Type.MedPack, { position: neighborPos2 })],
      },
    };

    // Build surroundings that match the bomb's neighborhood
    const surroundings: (Surrounding | undefined)[] = [
      // center (ClockFace.c = 0)
      { position: bombPos, occupant: undefined, tile: tiles.t[bombPos] },
      // tl (ClockFace.tl = 1)
      { position: TILE_START + 0, occupant: undefined, tile: tiles.t[TILE_START + 0] },
      // t (ClockFace.t = 2)
      { position: neighborPos2, occupant: undefined, tile: tiles.t[neighborPos2] },
      // tr (ClockFace.tr = 3)
      { position: TILE_START + 2, occupant: undefined, tile: tiles.t[TILE_START + 2] },
      // r (ClockFace.r = 4)
      { position: neighborPos1, occupant: undefined, tile: tiles.t[neighborPos1] },
      // br (ClockFace.br = 5)
      { position: TILE_START + 12, occupant: undefined, tile: tiles.t[TILE_START + 12] },
      // b (ClockFace.b = 6)
      { position: TILE_START + 11, occupant: undefined, tile: tiles.t[TILE_START + 11] },
      // bl (ClockFace.bl = 7)
      { position: TILE_START + 10, occupant: undefined, tile: tiles.t[TILE_START + 10] },
      // l (ClockFace.l = 8)
      { position: TILE_START + 5, occupant: undefined, tile: tiles.t[TILE_START + 5] },
    ];

    const sight = makeSight({
      center: surroundings[0],
      surroundings,
    });

    bomb.tap(sight, items, combatants, tiles);

    // Bomb should be spent
    expect(bomb.isSpent()).toBe(true);
    expect(bomb.toModel().state).toBe(ItemState.Spent);

    // Surrounding combatants should be killed
    expect(combatants.c[neighborPos1].state).toBe(State.Dead);
    expect(combatants.c[neighborPos2].state).toBe(State.Dead);

    // Surrounding items should be cleared
    expect(items.i[neighborPos1]).toEqual([]);
    expect(items.i[neighborPos2]).toEqual([]);
    expect(items.size).toBe(0); // was 2, each cleared position subtracts its count

    // Tick should have incremented
    expect(bomb.getAge()).toBe(4);
  });

  it('records kills for each combatant killed', () => {
    const bombPos = TILE_START + 6;
    const model = makeItemModel(Type.Bomb, { tick: 3, position: bombPos, kills: 0 });
    const bomb = new Bomb(model);
    const tiles = makeGrassTiles(5, 5);

    const neighborPos = TILE_START + 7;
    const combatants: Combatants = {
      size: 1,
      c: {
        [neighborPos]: makeCombatantModel({ position: neighborPos }),
      },
    };

    const items = emptyItems();

    const surroundings: (Surrounding | undefined)[] = [
      { position: bombPos, occupant: undefined, tile: tiles.t[bombPos] },
      undefined, // tl
      undefined, // t
      undefined, // tr
      { position: neighborPos, occupant: undefined, tile: tiles.t[neighborPos] }, // r
      undefined, // br
      undefined, // b
      undefined, // bl
      undefined, // l
    ];

    const sight = makeSight({
      center: surroundings[0],
      surroundings,
    });

    bomb.tap(sight, items, combatants, tiles);

    expect(bomb.toModel().kills).toBe(1);
  });

  it('skips undefined surroundings and invalid tiles', () => {
    const bombPos = TILE_START;
    const model = makeItemModel(Type.Bomb, { tick: 3, position: bombPos });
    const bomb = new Bomb(model);
    const tiles = makeGrassTiles(5, 5);

    const combatants = emptyCombatants();
    const items = emptyItems();

    // Only center is defined, rest are undefined (corner position)
    const surroundings: (Surrounding | undefined)[] = [
      { position: bombPos, occupant: undefined, tile: tiles.t[bombPos] },
      undefined, undefined, undefined,
      undefined, undefined, undefined,
      undefined, undefined,
    ];

    const sight = makeSight({
      center: surroundings[0],
      surroundings,
    });

    // Should not throw
    bomb.tap(sight, items, combatants, tiles);

    expect(bomb.isSpent()).toBe(true);
    expect(bomb.getAge()).toBe(4);
  });
});
