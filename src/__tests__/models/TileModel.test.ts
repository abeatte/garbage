import { createTileModel, Type as TileType } from '../../models/TileModel';
import { getMapTileEffect } from '../../models/CombatantModel';
import { Character } from '../../models/CombatantModel';

describe('createTileModel', () => {
  it('creates a tile with correct index and type', () => {
    const tile = createTileModel({ index: 5, type: TileType.Grass });
    expect(tile.index).toBe(5);
    expect(tile.type).toBe(TileType.Grass);
    expect(tile.score_potential).toEqual({});
  });
});

describe('getMapTileEffect', () => {
  it('returns negative for Fire tile (default)', () => {
    expect(getMapTileEffect({ species: Character.Bunny, tileType: TileType.Fire })).toBeLessThan(0);
  });

  it('returns positive for Grass tile', () => {
    expect(getMapTileEffect({ species: Character.Bunny, tileType: TileType.Grass })).toBeGreaterThanOrEqual(0);
  });

  it('Turtle gets bonus on Water tile', () => {
    const turtle = getMapTileEffect({ species: Character.Turtle, tileType: TileType.Water });
    const bunny = getMapTileEffect({ species: Character.Bunny, tileType: TileType.Water });
    expect(turtle).toBeGreaterThan(bunny);
  });

  it('Lizard gets reduced penalty on Fire tile', () => {
    const lizard = getMapTileEffect({ species: Character.Lizard, tileType: TileType.Fire });
    const bunny = getMapTileEffect({ species: Character.Bunny, tileType: TileType.Fire });
    expect(lizard).toBeGreaterThan(bunny);
  });

  it('returns 0 for undefined tile type', () => {
    expect(getMapTileEffect({ species: Character.Bunny, tileType: undefined })).toBe(0);
  });
});

import { getMapTileScorePotentials, clearMapTileScorePotentials } from '../../models/TileModel';
import { makeGrassTiles } from '../helpers/testFactories';
import { TILE_START } from '../../data/slices/boardSlice';

describe('getMapTileScorePotentials', () => {
  it('computes per-species scores based on surrounding tile types', () => {
    const tiles = makeGrassTiles(3, 3);
    // Center of 3x3 grid: TILE_START + 4 (row 1, col 1)
    const centerPos = TILE_START + 4;
    const potentials = getMapTileScorePotentials({ position: centerPos, tiles });

    // Should have entries for Character species
    expect(potentials).toBeDefined();
    expect(typeof potentials).toBe('object');
    // Bunny should have a numeric score on an all-grass grid
    expect(typeof potentials[Character.Bunny]).toBe('number');
  });

  it('caching: second call returns same cached values without recomputation', () => {
    const tiles = makeGrassTiles(3, 3);
    const centerPos = TILE_START + 4;

    const first = getMapTileScorePotentials({ position: centerPos, tiles });
    const second = getMapTileScorePotentials({ position: centerPos, tiles });

    // The cached result should be the same reference stored in tile.score_potential
    expect(second).toEqual(first);
    // Verify the tile's score_potential was populated (caching mechanism)
    expect(tiles.t[centerPos].score_potential).toEqual(first);
  });

  it('returns empty object for undefined tile', () => {
    const tiles = makeGrassTiles(3, 3);
    // Position outside the tile map — no tile exists
    const result = getMapTileScorePotentials({ position: 99999, tiles });
    expect(result).toEqual({});
  });
});

describe('clearMapTileScorePotentials', () => {
  it('resets score_potential to {} for center tile and adjacent tiles', () => {
    const tiles = makeGrassTiles(3, 3);
    const centerPos = TILE_START + 4; // row 1, col 1 of 3x3

    // Pre-populate score_potential on center and neighbors
    tiles.t[centerPos].score_potential = { test: 1 };
    tiles.t[centerPos - 1].score_potential = { test: 2 };       // left
    tiles.t[centerPos + 1].score_potential = { test: 3 };       // right
    tiles.t[centerPos - 3].score_potential = { test: 4 };       // up (width=3)
    tiles.t[centerPos + 3].score_potential = { test: 5 };       // down (width=3)

    clearMapTileScorePotentials({ position: centerPos, tiles });

    expect(tiles.t[centerPos].score_potential).toEqual({});
    expect(tiles.t[centerPos - 1].score_potential).toEqual({});  // left
    expect(tiles.t[centerPos + 1].score_potential).toEqual({});  // right
    expect(tiles.t[centerPos - 3].score_potential).toEqual({});  // up
    expect(tiles.t[centerPos + 3].score_potential).toEqual({});  // down
  });

  it('respects boundary conditions — does not clear tiles outside grid', () => {
    const tiles = makeGrassTiles(3, 3);
    // Top-left corner: TILE_START (row 0, col 0)
    const topLeft = TILE_START;

    // Pre-populate score_potential on center and valid neighbors only
    tiles.t[topLeft].score_potential = { test: 1 };
    tiles.t[topLeft + 1].score_potential = { test: 2 };         // right
    tiles.t[topLeft + 3].score_potential = { test: 3 };         // down (width=3)

    clearMapTileScorePotentials({ position: topLeft, tiles });

    // Center and valid neighbors should be cleared
    expect(tiles.t[topLeft].score_potential).toEqual({});
    expect(tiles.t[topLeft + 1].score_potential).toEqual({});    // right cleared
    expect(tiles.t[topLeft + 3].score_potential).toEqual({});    // down cleared

    // Left and up positions don't exist in the grid — no crash, no side effects
    expect(tiles.t[topLeft - 1]).toBeUndefined();
    expect(tiles.t[topLeft - 3]).toBeUndefined();
  });
});
