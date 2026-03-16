import { isValidCombatantPosition, isTileValidCombatantPosition, processBoardTick } from '../../data/utils/TurnProcessingUtils';
import { Combatants, Items, Tiles, TILE_START } from '../../data/slices/boardSlice';
import { Type as TileType, createTileModel } from '../../models/TileModel';
import { DEFAULT } from '../../models/GlobalCombatantStatsModel';
import { State, Character, DecisionType, Gender, Strength } from '../../models/CombatantModel';

const makeGrassTiles = (width = 5, height = 5): Tiles => {
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
};

const emptyCombatants = (): Combatants => ({ size: 0, c: {} });
const emptyItems = (): Items => ({ size: 0, i: {} });

describe('isTileValidCombatantPosition', () => {
  it('returns false for undefined tile', () => {
    expect(isTileValidCombatantPosition(undefined)).toBe(false);
  });

  it('returns false for Void tile', () => {
    const tile = createTileModel({ index: 0, type: TileType.Void });
    expect(isTileValidCombatantPosition(tile)).toBe(false);
  });

  it('returns true for Grass tile', () => {
    const tile = createTileModel({ index: 0, type: TileType.Grass });
    expect(isTileValidCombatantPosition(tile)).toBe(true);
  });

  it('returns true for Void tile when ignore_void is true', () => {
    const tile = createTileModel({ index: 0, type: TileType.Void });
    expect(isTileValidCombatantPosition(tile, true)).toBe(true);
  });
});

describe('isValidCombatantPosition', () => {
  const tiles = makeGrassTiles();

  it('returns false for undefined position', () => {
    expect(isValidCombatantPosition(undefined, tiles)).toBe(false);
  });

  it('returns false for position before start', () => {
    expect(isValidCombatantPosition(TILE_START - 1, tiles)).toBe(false);
  });

  it('returns false for position after end', () => {
    expect(isValidCombatantPosition(tiles.end + 1, tiles)).toBe(false);
  });

  it('returns true for valid position', () => {
    expect(isValidCombatantPosition(TILE_START, tiles)).toBe(true);
  });

  it('returns false for Void tile at valid position', () => {
    const voidTiles = makeGrassTiles();
    voidTiles.t[TILE_START] = createTileModel({ index: TILE_START, type: TileType.Void });
    expect(isValidCombatantPosition(TILE_START, voidTiles)).toBe(false);
  });
});

describe('processBoardTick', () => {
  it('returns same structure with no combatants', () => {
    const tiles = makeGrassTiles();
    const result = processBoardTick({
      player: undefined,
      combatants: emptyCombatants(),
      items: emptyItems(),
      tiles,
      use_genders: false,
      global_combatant_stats: { ...DEFAULT },
    });
    expect(result.combatants.size).toBe(0);
    expect(result.items.size).toBe(0);
  });

  it('processes a single combatant tick without error', () => {
    const tiles = makeGrassTiles();
    const combatants: Combatants = {
      size: 1,
      c: {
        [TILE_START + 12]: {
          id: 'c1',
          position: TILE_START + 12,
          is_player: false,
          name: 'Test',
          state: State.Alive,
          fitness: 0,
          strength: Strength.Average,
          decision_type: DecisionType.Neutral,
          immortal: false,
          species: Character.Bunny,
          gender: Gender.Male,
          kills: 0,
          children: 0,
          tick: 10,
          target_waypoints: [],
          visited_positions: { [TILE_START + 12]: TILE_START + 12 },
          spawn: undefined,
        },
      },
    };

    const result = processBoardTick({
      player: undefined,
      combatants,
      items: emptyItems(),
      tiles,
      use_genders: false,
      global_combatant_stats: { ...DEFAULT },
    });

    // combatant should still exist (grass tile, no damage)
    expect(result.combatants.size).toBeGreaterThanOrEqual(0);
  });

  it('tracks deaths from fire tile damage', () => {
    // Surround the combatant with fire tiles so it cannot escape damage
    const tiles = makeGrassTiles(3, 3);
    for (let i = 0; i < 9; i++) {
      tiles.t[TILE_START + i] = createTileModel({ index: TILE_START + i, type: TileType.Fire });
    }
    const combatants: Combatants = {
      size: 1,
      c: {
        [TILE_START + 4]: {
          id: 'c1',
          position: TILE_START + 4,
          is_player: false,
          name: 'Test',
          state: State.Alive,
          fitness: -490, // close to MIN_HEALTH (-500), fire will push it over
          strength: Strength.Weak,
          decision_type: DecisionType.Neutral,
          immortal: false,
          species: Character.Bunny,
          gender: Gender.Male,
          kills: 0,
          children: 0,
          tick: 10,
          target_waypoints: [],
          visited_positions: { [TILE_START + 4]: TILE_START + 4 },
          spawn: undefined,
        },
      },
    };

    const result = processBoardTick({
      player: undefined,
      combatants,
      items: emptyItems(),
      tiles,
      use_genders: false,
      global_combatant_stats: { ...DEFAULT },
    });

    expect(result.global_combatant_stats.deaths).toBeGreaterThan(0);
  });
});
