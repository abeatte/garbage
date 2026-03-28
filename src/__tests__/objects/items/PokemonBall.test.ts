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
import PokemonBall from '../../../objects/items/PokemonBall';
import { ItemState, Type, SpiderType, ItemType } from '../../../objects/items/Item';
import { State } from '../../../models/CombatantModel';
import { createTileModel, Type as TileType } from '../../../models/TileModel';
import { Surrounding } from '../../../data/utils/SightUtils';

describe('PokemonBall.IsOf', () => {
  it('returns true for { type: Type.PokemonBall }', () => {
    expect(PokemonBall.IsOf({ type: Type.PokemonBall })).toBe(true);
  });

  it('returns false for Bomb type', () => {
    expect(PokemonBall.IsOf({ type: Type.Bomb })).toBe(false);
  });

  it('returns false for MedPack type', () => {
    expect(PokemonBall.IsOf({ type: Type.MedPack })).toBe(false);
  });

  it('returns false for spider types', () => {
    expect(PokemonBall.IsOf({ type: SpiderType.FireSpider as ItemType })).toBe(false);
  });
});

describe('PokemonBall fuse_length', () => {
  it('is 25 for PokemonBall', () => {
    const model = makeItemModel(Type.PokemonBall);
    const ball = new PokemonBall(model);
    expect(ball.toModel().fuse_length).toBe(25);
  });
});

describe('PokemonBall.tap before fuse-up', () => {
  /**
   * Helper: build a 5×5 grid sight centered at bombPos (row 1, col 1)
   * with all 9 surroundings defined on valid Grass tiles.
   */
  function buildFullSight(tiles: ReturnType<typeof makeGrassTiles>, centerPos: number) {
    const w = tiles.width;
    const positions = [
      centerPos,              // c  (0)
      centerPos - w - 1,      // tl (1)
      centerPos - w,          // t  (2)
      centerPos - w + 1,      // tr (3)
      centerPos + 1,          // r  (4)
      centerPos + w + 1,      // br (5)
      centerPos + w,          // b  (6)
      centerPos + w - 1,      // bl (7)
      centerPos - 1,          // l  (8)
    ];

    const surroundings: (Surrounding | undefined)[] = positions.map(pos => ({
      position: pos,
      occupant: undefined,
      tile: tiles.t[pos],
    }));

    return makeSight({
      center: surroundings[0],
      surroundings,
    });
  }

  it('captures surrounding combatants (sets state to Captured, adds to captured array)', () => {
    const ballPos = TILE_START + 6; // row 1, col 1 in 5×5 grid
    const model = makeItemModel(Type.PokemonBall, { tick: 0, position: ballPos, captured: [] });
    const ball = new PokemonBall(model);
    const tiles = makeGrassTiles(5, 5);

    // Place combatants in surrounding positions
    const neighborPos1 = TILE_START + 7; // right of ball
    const neighborPos2 = TILE_START + 1; // above ball
    const combatants: Combatants = {
      size: 2,
      c: {
        [neighborPos1]: makeCombatantModel({ position: neighborPos1 }),
        [neighborPos2]: makeCombatantModel({ position: neighborPos2 }),
      },
    };
    const items = emptyItems();
    const sight = buildFullSight(tiles, ballPos);

    ball.tap(sight, items, combatants, tiles);

    // Captured combatants should be in the ball's captured array
    const captured = ball.toModel().captured;
    expect(captured.length).toBe(2);
    // Each captured combatant should have state Captured
    captured.forEach(c => {
      expect(c.state).toBe(State.Captured);
    });
    // Ball should be added to the board (persists before fuse-up)
    expect(items.i[ballPos]).toBeDefined();
    expect(items.size).toBe(1);
    // Tick should have incremented
    expect(ball.getAge()).toBe(1);
  });

  it('respects capacity limit (only captures up to number of valid surrounding tiles)', () => {
    // Use a corner position so fewer valid surroundings exist
    const ballPos = TILE_START; // top-left corner
    const model = makeItemModel(Type.PokemonBall, { tick: 0, position: ballPos, captured: [] });
    const ball = new PokemonBall(model);
    const tiles = makeGrassTiles(5, 5);

    // Only right (pos+1) and below (pos+5) and bottom-right (pos+6) are valid from corner
    // Place many combatants around
    const rightPos = TILE_START + 1;
    const belowPos = TILE_START + 5;
    const brPos = TILE_START + 6;
    const combatants: Combatants = {
      size: 3,
      c: {
        [rightPos]: makeCombatantModel({ position: rightPos }),
        [belowPos]: makeCombatantModel({ position: belowPos }),
        [brPos]: makeCombatantModel({ position: brPos }),
      },
    };
    const items = emptyItems();

    // Build corner sight: only c, r, br, b are defined
    const w = tiles.width;
    const surroundings: (Surrounding | undefined)[] = [
      { position: ballPos, occupant: undefined, tile: tiles.t[ballPos] },       // c
      undefined,                                                                  // tl
      undefined,                                                                  // t
      undefined,                                                                  // tr
      { position: rightPos, occupant: undefined, tile: tiles.t[rightPos] },      // r
      { position: brPos, occupant: undefined, tile: tiles.t[brPos] },            // br
      { position: belowPos, occupant: undefined, tile: tiles.t[belowPos] },      // b
      undefined,                                                                  // bl
      undefined,                                                                  // l
    ];
    const sight = makeSight({ center: surroundings[0], surroundings });

    ball.tap(sight, items, combatants, tiles);

    // Capacity is the number of valid surrounding tiles (4: c, r, br, b)
    // All 3 combatants should be captured since 3 < 4
    const captured = ball.toModel().captured;
    expect(captured.length).toBe(3);
    expect(items.size).toBe(1); // ball persists on board
  });
});

describe('PokemonBall.tap on fuse-up (tick >= 25)', () => {
  it('releases captives with releaseFromCaptivity(fuse_length)', () => {
    const ballPos = TILE_START + 6; // row 1, col 1 in 5×5 grid
    const tiles = makeGrassTiles(5, 5);

    // Create captive combatant models (already captured)
    const captive1 = makeCombatantModel({ state: State.Captured, position: -1, tick: 5 });
    const captive2 = makeCombatantModel({ state: State.Captured, position: -1, tick: 10 });

    const model = makeItemModel(Type.PokemonBall, {
      tick: 25,
      position: ballPos,
      captured: [captive1, captive2],
    });
    const ball = new PokemonBall(model);

    const combatants = emptyCombatants();
    const items = emptyItems();

    // Build full sight with all 9 valid surroundings (no occupants)
    const w = tiles.width;
    const positions = [
      ballPos,
      ballPos - w - 1, ballPos - w, ballPos - w + 1,
      ballPos + 1,
      ballPos + w + 1, ballPos + w, ballPos + w - 1,
      ballPos - 1,
    ];
    const surroundings: (Surrounding | undefined)[] = positions.map(pos => ({
      position: pos,
      occupant: undefined,
      tile: tiles.t[pos],
    }));
    const sight = makeSight({ center: surroundings[0], surroundings });

    ball.tap(sight, items, combatants, tiles);

    // Captives should be released and placed on the board
    // They should be alive and their age increased by fuse_length (25)
    const placedPositions = Object.keys(combatants.c).map(Number);
    expect(placedPositions.length).toBe(2);

    placedPositions.forEach(pos => {
      const c = combatants.c[pos];
      expect(c.state).toBe(State.Alive);
    });

    // Verify age was increased by fuse_length (25)
    // One captive had tick=5, other had tick=10
    const ages = placedPositions.map(pos => combatants.c[pos].tick).sort((a, b) => a - b);
    expect(ages).toEqual([30, 35]); // 5+25, 10+25

    // Ball's captured array should be empty after release
    expect(ball.toModel().captured.length).toBe(0);
    // Tick should have incremented
    expect(ball.getAge()).toBe(26);
  });

  it('released captives fight occupants if tile is occupied, winner stays', () => {
    const ballPos = TILE_START + 6;
    const tiles = makeGrassTiles(5, 5);

    // Create a captive with very high fitness (will win fights)
    const captive = makeCombatantModel({
      state: State.Captured,
      position: -1,
      tick: 10,
      fitness: 9999,
    });

    const model = makeItemModel(Type.PokemonBall, {
      tick: 25,
      position: ballPos,
      captured: [captive],
    });
    const ball = new PokemonBall(model);

    // Place an occupant at a surrounding position (weak, will lose)
    const occupantPos = TILE_START + 7; // right of ball
    const occupantModel = makeCombatantModel({ position: occupantPos, fitness: -100 });
    const combatants: Combatants = {
      size: 1,
      c: {
        [occupantPos]: occupantModel,
      },
    };
    const items = emptyItems();

    // Build sight — only provide a few valid surroundings
    const w = tiles.width;
    const positions = [
      ballPos,
      ballPos - w - 1, ballPos - w, ballPos - w + 1,
      ballPos + 1,
      ballPos + w + 1, ballPos + w, ballPos + w - 1,
      ballPos - 1,
    ];
    const surroundings: (Surrounding | undefined)[] = positions.map(pos => ({
      position: pos,
      occupant: undefined,
      tile: tiles.t[pos],
    }));
    const sight = makeSight({ center: surroundings[0], surroundings });

    ball.tap(sight, items, combatants, tiles);

    // The captive (high fitness) should win the fight and occupy the position
    // The occupant at occupantPos should be replaced by the winner
    // Since captives are popped from the end and valid_surroundings are also popped,
    // the captive gets the last valid surrounding position
    const allPositions = Object.keys(combatants.c).map(Number);
    // There should be a combatant placed somewhere
    expect(allPositions.length).toBeGreaterThanOrEqual(1);

    // The winner should be alive (the strong captive wins)
    const winnerPos = allPositions.find(pos => combatants.c[pos].state === State.Alive);
    expect(winnerPos).toBeDefined();
    expect(combatants.c[winnerPos!].fitness).toBe(9999);
  });

  it('released captives placed at empty surrounding positions', () => {
    const ballPos = TILE_START + 6;
    const tiles = makeGrassTiles(5, 5);

    const captive = makeCombatantModel({
      state: State.Captured,
      position: -1,
      tick: 0,
    });

    const model = makeItemModel(Type.PokemonBall, {
      tick: 25,
      position: ballPos,
      captured: [captive],
    });
    const ball = new PokemonBall(model);

    const combatants = emptyCombatants();
    const items = emptyItems();

    // Build full sight with all empty surroundings
    const w = tiles.width;
    const positions = [
      ballPos,
      ballPos - w - 1, ballPos - w, ballPos - w + 1,
      ballPos + 1,
      ballPos + w + 1, ballPos + w, ballPos + w - 1,
      ballPos - 1,
    ];
    const surroundings: (Surrounding | undefined)[] = positions.map(pos => ({
      position: pos,
      occupant: undefined,
      tile: tiles.t[pos],
    }));
    const sight = makeSight({ center: surroundings[0], surroundings });

    ball.tap(sight, items, combatants, tiles);

    // Captive should be placed at one of the surrounding positions
    const placedPositions = Object.keys(combatants.c).map(Number);
    expect(placedPositions.length).toBe(1);

    const placedPos = placedPositions[0];
    // Should be one of the valid surrounding positions
    expect(positions).toContain(placedPos);
    // Should be alive after release
    expect(combatants.c[placedPos].state).toBe(State.Alive);
  });
});
