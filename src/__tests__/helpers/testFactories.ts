/**
 * Shared test factories for consistent test data across all test files.
 *
 * Extracts common patterns from TurnProcessingUtils.test.ts and
 * TargetingUtils.test.ts into reusable helpers.
 */

import { Combatants, Items, Tiles, TILE_START } from '../../data/slices/boardSlice';
import { createTileModel, Type as TileType } from '../../models/TileModel';
import CombatantModel, {
  Character,
  DecisionType,
  Gender,
  State,
  Strength,
} from '../../models/CombatantModel';
import { ItemModel, ItemType, DEFAULT_ITEM } from '../../objects/items/Item';
import { Sight, Surrounding } from '../../data/utils/SightUtils';
import uuid from 'react-uuid';

/**
 * Creates a Tiles object filled with Grass tiles.
 * Extracted from TurnProcessingUtils.test.ts pattern.
 */
export function makeGrassTiles(width = 5, height = 5): Tiles {
  const tiles: Tiles = {
    width,
    height,
    start: TILE_START,
    end: TILE_START + width * height - 1,
    size: width * height,
    t: {},
  };
  for (let i = 0; i < width * height; i++) {
    tiles.t[TILE_START + i] = createTileModel({ index: TILE_START + i, type: TileType.Grass });
  }
  return tiles;
}

/**
 * Creates a full CombatantModel with sensible defaults.
 * Extracted from TargetingUtils.test.ts pattern.
 */
export function makeCombatantModel(overrides?: Partial<CombatantModel>): CombatantModel {
  return {
    id: uuid(),
    position: TILE_START,
    is_player: false,
    name: 'TestCombatant',
    state: State.Alive,
    fitness: 0,
    strength: Strength.Average,
    decision_type: DecisionType.Neutral,
    immortal: false,
    species: Character.Bunny,
    gender: Gender.Male,
    kills: 0,
    children: 0,
    tick: 0,
    target_waypoints: [],
    visited_positions: {},
    spawn: undefined,
    ...overrides,
  };
}

/**
 * Creates an ItemModel with DEFAULT_ITEM base plus type and position.
 */
export function makeItemModel(type: ItemType, overrides?: Partial<ItemModel>): ItemModel {
  return {
    ...DEFAULT_ITEM,
    id: uuid(),
    type,
    position: TILE_START,
    ...overrides,
  } as ItemModel;
}

/** Returns an empty Combatants collection. */
export function emptyCombatants(): Combatants {
  return { size: 0, c: {} };
}

/** Returns an empty Items collection. */
export function emptyItems(): Items {
  return { size: 0, i: {} };
}

/**
 * Creates a minimal Sight object with 9-element surroundings array,
 * center, min/max potential, and getNewRandomPosition stub.
 */
export function makeSight(overrides?: Partial<Sight>): Sight {
  const defaultCenter: Surrounding = {
    position: TILE_START,
    occupant: undefined,
    tile: createTileModel({ index: TILE_START, type: TileType.Grass }),
  };

  const defaultSurroundings: (Surrounding | undefined)[] = Array(9).fill(undefined).map((_, i) => ({
    position: TILE_START + i,
    occupant: undefined,
    tile: createTileModel({ index: TILE_START + i, type: TileType.Grass }),
  }));

  return {
    min_potential: 0,
    max_potential: 50,
    center: defaultCenter,
    surroundings: defaultSurroundings,
    getNewRandomPosition: () => TILE_START,
    ...overrides,
  };
}

// Jest requires at least one test in files under __tests__/
// This file is a shared helper module, not a test suite.
test('testFactories module exports are defined', () => {
  expect(makeGrassTiles).toBeDefined();
  expect(makeCombatantModel).toBeDefined();
  expect(makeItemModel).toBeDefined();
  expect(emptyCombatants).toBeDefined();
  expect(emptyItems).toBeDefined();
  expect(makeSight).toBeDefined();
});
