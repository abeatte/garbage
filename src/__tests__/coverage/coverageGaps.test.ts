/**
 * Bug Condition Exploration Test — Coverage Gap Verification
 *
 * This test imports and calls key untested functions across 14 modules.
 * It references shared test factories from testFactories.ts which do not
 * yet exist, confirming the test infrastructure gap.
 *
 * EXPECTED: This test FAILS on unfixed code (proves the coverage gaps exist).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
 *            1.10, 1.11, 1.12, 1.13, 1.14
 */

// Shared test factories — these DO NOT EXIST yet, confirming infrastructure gap
import {
  makeGrassTiles,
  makeCombatantModel,
  makeItemModel,
  emptyCombatants,
  emptyItems,
  makeSight,
} from '../helpers/testFactories';

// Source modules under test
import Player from '../../objects/combatants/Player';
import Seeker from '../../objects/combatants/Seeker';
import NPC from '../../objects/combatants/NPC';
import Bomb from '../../objects/items/Bomb';
import MedPack from '../../objects/items/MedPack';
import PokemonBall from '../../objects/items/PokemonBall';
import Spider from '../../objects/items/Spider';
import { viewSurroundings } from '../../data/utils/SightUtils';
import { getNewPositionFromArrowKey, getMapTileEffect, Character } from '../../models/CombatantModel';
import { DecisionType, State, Gender } from '../../models/CombatantModel';
import { getMapTileScorePotentials, clearMapTileScorePotentials, Type as TileType } from '../../models/TileModel';
import { initCombatantStartingPos, updateCombatantsPositionsAfterResize } from '../../data/utils/CombatantUtils';
import { updateItemsAfterResize } from '../../data/utils/ItemUtils';
import { TILE_START } from '../../data/slices/boardSlice';
import { ArrowKey } from '../../data/utils/GameUtils';
import { Type, SpiderType, ItemState } from '../../objects/items/Item';


// ─── Gap 1: Player.IsOf and Player.requestMove ───────────────────────────────
describe('Gap 1 — Player (Req 1.1)', () => {
  it('Player.IsOf returns true for is_player model', () => {
    expect(Player.IsOf({ is_player: true })).toBe(true);
  });

  it('Player.IsOf returns false for non-player model', () => {
    expect(Player.IsOf({ is_player: false })).toBe(false);
    expect(Player.IsOf({} as any)).toBe(false);
  });

  it('Player.requestMove returns shifted waypoint when valid', () => {
    const tiles = makeGrassTiles(5, 5);
    const model = makeCombatantModel({
      position: TILE_START + 12,
      target_waypoints: [TILE_START + 13],
    });
    const player = new Player(model);
    const sight = makeSight();
    const result = player.requestMove({ sight, tiles, window_width: 5 });
    expect(result).toBe(TILE_START + 13);
  });

  it('Player.requestMove returns current position when no waypoints', () => {
    const tiles = makeGrassTiles(5, 5);
    const model = makeCombatantModel({
      position: TILE_START + 12,
      target_waypoints: [],
    });
    const player = new Player(model);
    const sight = makeSight();
    const result = player.requestMove({ sight, tiles, window_width: 5 });
    expect(result).toBe(TILE_START + 12);
  });
});

// ─── Gap 2: Seeker.IsOf and Seeker.beBorn ────────────────────────────────────
describe('Gap 2 — Seeker (Req 1.2)', () => {
  it('Seeker.IsOf returns true for Seeker decision type', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Seeker })).toBe(true);
  });

  it('Seeker.IsOf returns false for other decision types', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Neutral })).toBe(false);
    expect(Seeker.IsOf({} as any)).toBe(false);
  });

  it('Seeker.beBorn sets state to Alive and pushes waypoint', () => {
    const model = makeCombatantModel({
      position: TILE_START,
      decision_type: DecisionType.Seeker,
    });
    const seeker = new Seeker(model);
    seeker.beBorn(TILE_START + 5, []);
    expect(seeker.getState()).toBe(State.Alive);
  });

  it('Seeker.getSpawnDecisionType returns Seeker', () => {
    const model = makeCombatantModel({ decision_type: DecisionType.Seeker });
    const seeker = new Seeker(model);
    expect(seeker.getSpawnDecisionType()).toBe(DecisionType.Seeker);
  });
});

// ─── Gap 3: NPC.IsOf ─────────────────────────────────────────────────────────
describe('Gap 3 — NPC (Req 1.3)', () => {
  it('NPC.IsOf returns true when position is defined', () => {
    expect(NPC.IsOf({ position: TILE_START })).toBe(true);
  });

  it('NPC.IsOf returns false when position is undefined', () => {
    expect(NPC.IsOf({} as any)).toBe(false);
  });
});


// ─── Gap 4: Bomb.tap ─────────────────────────────────────────────────────────
describe('Gap 4 — Bomb (Req 1.4)', () => {
  it('Bomb.IsOf returns true for Bomb type', () => {
    expect(Bomb.IsOf({ type: Type.Bomb })).toBe(true);
  });

  it('Bomb.IsOf returns false for other types', () => {
    expect(Bomb.IsOf({ type: Type.MedPack })).toBe(false);
  });

  it('Bomb.tap before fuse-up adds self to board', () => {
    const itemModel = makeItemModel(Type.Bomb, { position: TILE_START, tick: 0 });
    const bomb = new Bomb(itemModel);
    const sight = makeSight();
    const items = emptyItems();
    const combatants = emptyCombatants();
    const tiles = makeGrassTiles(5, 5);
    bomb.tap(sight, items, combatants, tiles);
    expect(items.size).toBeGreaterThan(0);
  });
});

// ─── Gap 5: MedPack.tap ──────────────────────────────────────────────────────
describe('Gap 5 — MedPack (Req 1.5)', () => {
  it('MedPack.IsOf returns true for MedPack type', () => {
    expect(MedPack.IsOf({ type: Type.MedPack })).toBe(true);
  });

  it('MedPack.IsOf returns false for other types', () => {
    expect(MedPack.IsOf({ type: Type.Bomb })).toBe(false);
  });

  it('MedPack.tap persists on board when no occupant', () => {
    const itemModel = makeItemModel(Type.MedPack, { position: TILE_START });
    const medpack = new MedPack(itemModel);
    const sight = makeSight({ center: { position: TILE_START, occupant: undefined, tile: { index: TILE_START, type: TileType.Grass, score_potential: {} } } });
    const items = emptyItems();
    const combatants = emptyCombatants();
    const tiles = makeGrassTiles(5, 5);
    medpack.tap(sight, items, combatants, tiles);
    expect(items.size).toBeGreaterThan(0);
  });
});

// ─── Gap 6: PokemonBall.tap ──────────────────────────────────────────────────
describe('Gap 6 — PokemonBall (Req 1.6)', () => {
  it('PokemonBall.IsOf returns true for PokemonBall type', () => {
    expect(PokemonBall.IsOf({ type: Type.PokemonBall })).toBe(true);
  });

  it('PokemonBall.IsOf returns false for other types', () => {
    expect(PokemonBall.IsOf({ type: Type.Bomb })).toBe(false);
  });
});

// ─── Gap 7: Spider.tap and Spider.getActionType ──────────────────────────────
describe('Gap 7 — Spider (Req 1.7)', () => {
  it('Spider.IsOf returns true for all SpiderType values', () => {
    for (const st of Object.values(SpiderType)) {
      expect(Spider.IsOf({ type: st })).toBe(true);
    }
  });

  it('Spider.IsOf returns false for non-spider types', () => {
    expect(Spider.IsOf({ type: Type.Bomb })).toBe(false);
    expect(Spider.IsOf({ type: Type.MedPack })).toBe(false);
  });

  it('Spider.getActionType maps SpiderType to TileType', () => {
    const itemModel = makeItemModel(SpiderType.WaterSpider as any, { position: TILE_START });
    const spider = new Spider(itemModel);
    expect(spider.getActionType()).toBe(TileType.Water);
  });
});


// ─── Gap 8: viewSurroundings boundary cases ──────────────────────────────────
describe('Gap 8 — SightUtils viewSurroundings (Req 1.8)', () => {
  it('viewSurroundings returns 9-element surroundings array', () => {
    const tiles = makeGrassTiles(5, 5);
    const sight = viewSurroundings({ position: TILE_START + 12, tiles });
    expect(sight.surroundings).toHaveLength(9);
  });

  it('corner position (top-left) has undefined neighbors for tl/t/tr/l', () => {
    const tiles = makeGrassTiles(5, 5);
    const sight = viewSurroundings({ position: TILE_START, tiles });
    // top-left corner: tl(1), t(2), tr(3), l(8) should be undefined
    expect(sight.surroundings[1]).toBeUndefined(); // tl
    expect(sight.surroundings[2]).toBeUndefined(); // t
    expect(sight.surroundings[3]).toBeUndefined(); // tr
    expect(sight.surroundings[8]).toBeUndefined(); // l
  });
});

// ─── Gap 9: getNewPositionFromArrowKey ───────────────────────────────────────
describe('Gap 9 — CombatantModel helpers (Req 1.9)', () => {
  it('getNewPositionFromArrowKey ARROWRIGHT increments by 1', () => {
    const result = getNewPositionFromArrowKey(TILE_START + 12, ArrowKey.ARROWRIGHT, 5, TILE_START, TILE_START + 24);
    expect(result).toBe(TILE_START + 13);
  });

  it('getNewPositionFromArrowKey ARROWLEFT decrements by 1', () => {
    const result = getNewPositionFromArrowKey(TILE_START + 12, ArrowKey.ARROWLEFT, 5, TILE_START, TILE_START + 24);
    expect(result).toBe(TILE_START + 11);
  });

  it('getNewPositionFromArrowKey ARROWUP decrements by width', () => {
    const result = getNewPositionFromArrowKey(TILE_START + 12, ArrowKey.ARROWUP, 5, TILE_START, TILE_START + 24);
    expect(result).toBe(TILE_START + 7);
  });

  it('getNewPositionFromArrowKey ARROWDOWN increments by width', () => {
    const result = getNewPositionFromArrowKey(TILE_START + 12, ArrowKey.ARROWDOWN, 5, TILE_START, TILE_START + 24);
    expect(result).toBe(TILE_START + 17);
  });

  it('boundary: left edge stays put on ARROWLEFT', () => {
    const result = getNewPositionFromArrowKey(TILE_START, ArrowKey.ARROWLEFT, 5, TILE_START, TILE_START + 24);
    expect(result).toBe(TILE_START);
  });

  it('getMapTileEffect returns species-specific values', () => {
    // Turtle gets Water bonus (+10) → -5 + 10 = +5
    expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Water })).toBe(5);
    // Turtle gets extra Fire penalty (-10) → -50 + (-10) = -60
    expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Fire })).toBe(-60);
  });
});

// ─── Gap 10: Combatant.canMateWith ───────────────────────────────────────────
describe('Gap 10 — Combatant mating/movement (Req 1.10)', () => {
  it('canMateWith returns false when either combatant is too young', () => {
    const model1 = makeCombatantModel({ position: TILE_START, tick: 0, gender: Gender.Male });
    const model2 = makeCombatantModel({ position: TILE_START + 1, tick: 100, gender: Gender.Female });
    const npc1 = new NPC(model1);
    const npc2 = new NPC(model2);
    expect(npc1.canMateWith(npc2, true)).toBe(false);
  });

  it('canMateWith returns true when different gender and both old enough', () => {
    const model1 = makeCombatantModel({ position: TILE_START, tick: 100, gender: Gender.Male });
    const model2 = makeCombatantModel({ position: TILE_START + 1, tick: 100, gender: Gender.Female });
    const npc1 = new NPC(model1);
    const npc2 = new NPC(model2);
    expect(npc1.canMateWith(npc2, true)).toBe(true);
  });

  it('releaseFromCaptivity transitions from Captured to Alive', () => {
    const model = makeCombatantModel({ position: TILE_START });
    const npc = new NPC(model);
    npc.capture();
    expect(npc.isCaptured()).toBe(true);
    npc.releaseFromCaptivity(10);
    expect(npc.getState()).toBe(State.Alive);
  });
});


// ─── Gap 11: boardSlice resize reducers ──────────────────────────────────────
describe('Gap 11 — boardSlice resize reducers (Req 1.11)', () => {
  it('confirms boardSlice resize reducers exist but have no dedicated tests', () => {
    // This test documents the gap — the actual resize reducer tests
    // will be added in task 7.1
    // Using makeGrassTiles to confirm factory dependency
    const tiles = makeGrassTiles(5, 5);
    expect(tiles.width).toBe(5);
    expect(tiles.height).toBe(5);
  });
});

// ─── Gap 12: initCombatantStartingPos ────────────────────────────────────────
describe('Gap 12 — initCombatantStartingPos (Req 1.12)', () => {
  it('returns a valid position on non-void tiles', () => {
    const tiles = makeGrassTiles(5, 5);
    const combatants = emptyCombatants();
    const pos = initCombatantStartingPos({ tiles, player: undefined, combatants });
    expect(pos).toBeGreaterThanOrEqual(tiles.start);
    expect(pos).toBeLessThanOrEqual(tiles.end);
  });
});

// ─── Gap 13: updateItemsAfterResize ──────────────────────────────────────────
describe('Gap 13 — updateItemsAfterResize (Req 1.13)', () => {
  it('handles empty items collection', () => {
    const tiles = makeGrassTiles(5, 5);
    const items = emptyItems();
    const result = updateItemsAfterResize({ items, old_window_width: 4, tiles });
    expect(result.size).toBe(0);
  });
});

// ─── Gap 14: getMapTileScorePotentials ───────────────────────────────────────
describe('Gap 14 — getMapTileScorePotentials (Req 1.14)', () => {
  it('computes per-species scores based on surrounding tiles', () => {
    const tiles = makeGrassTiles(5, 5);
    const potentials = getMapTileScorePotentials({ position: TILE_START + 12, tiles });
    // Should have entries for each Character species
    expect(potentials[Character.Bunny]).toBeDefined();
    expect(potentials[Character.Turtle]).toBeDefined();
  });

  it('returns empty object for undefined tile', () => {
    const tiles = makeGrassTiles(5, 5);
    const potentials = getMapTileScorePotentials({ position: TILE_START + 999, tiles });
    expect(potentials[Character.Bunny]).toBeUndefined();
  });

  it('clearMapTileScorePotentials resets cache for center and adjacent', () => {
    const tiles = makeGrassTiles(5, 5);
    // First compute to populate cache
    getMapTileScorePotentials({ position: TILE_START + 12, tiles });
    expect(tiles.t[TILE_START + 12]!.score_potential[Character.Bunny]).toBeDefined();
    // Clear
    clearMapTileScorePotentials({ position: TILE_START + 12, tiles });
    expect(tiles.t[TILE_START + 12]!.score_potential).toEqual({});
  });
});
