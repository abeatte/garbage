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
