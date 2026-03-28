import {
  getNewPositionFromArrowKey,
  getRandomSpecies,
  getMapTileEffect,
  Character,
} from '../../models/CombatantModel';
import { ArrowKey } from '../../data/utils/GameUtils';
import { Type as TileType } from '../../models/TileModel';
import { TILE_START } from '../../data/slices/boardSlice';

describe('getNewPositionFromArrowKey', () => {
  const width = 5;
  const tileEnd = TILE_START + width * 5 - 1; // 5x5 grid

  describe('basic movement', () => {
    // Center of grid: row 2, col 2 → position = TILE_START + 12
    const center = TILE_START + 12;

    it('ARROWLEFT decrements position by 1', () => {
      expect(getNewPositionFromArrowKey(center, ArrowKey.ARROWLEFT, width, TILE_START, tileEnd))
        .toBe(center - 1);
    });

    it('ARROWRIGHT increments position by 1', () => {
      expect(getNewPositionFromArrowKey(center, ArrowKey.ARROWRIGHT, width, TILE_START, tileEnd))
        .toBe(center + 1);
    });

    it('ARROWUP decrements position by width', () => {
      expect(getNewPositionFromArrowKey(center, ArrowKey.ARROWUP, width, TILE_START, tileEnd))
        .toBe(center - width);
    });

    it('ARROWDOWN increments position by width', () => {
      expect(getNewPositionFromArrowKey(center, ArrowKey.ARROWDOWN, width, TILE_START, tileEnd))
        .toBe(center + width);
    });
  });

  describe('boundary clamping', () => {
    it('left edge stays put on ARROWLEFT', () => {
      const leftEdge = TILE_START + 5; // row 1, col 0
      expect(getNewPositionFromArrowKey(leftEdge, ArrowKey.ARROWLEFT, width, TILE_START, tileEnd))
        .toBe(leftEdge);
    });

    it('top edge stays put on ARROWUP', () => {
      const topEdge = TILE_START + 2; // row 0, col 2
      expect(getNewPositionFromArrowKey(topEdge, ArrowKey.ARROWUP, width, TILE_START, tileEnd))
        .toBe(topEdge);
    });

    it('right edge stays put on ARROWRIGHT', () => {
      const rightEdge = TILE_START + 9; // row 1, col 4
      expect(getNewPositionFromArrowKey(rightEdge, ArrowKey.ARROWRIGHT, width, TILE_START, tileEnd))
        .toBe(rightEdge);
    });

    it('bottom edge stays put on ARROWDOWN', () => {
      const bottomEdge = TILE_START + 22; // row 4, col 2
      expect(getNewPositionFromArrowKey(bottomEdge, ArrowKey.ARROWDOWN, width, TILE_START, tileEnd))
        .toBe(bottomEdge);
    });
  });
});

describe('getRandomSpecies', () => {
  it('returns a valid Character enum value', () => {
    const validSpecies = Object.values(Character);
    // Run multiple times to increase confidence
    for (let i = 0; i < 20; i++) {
      const species = getRandomSpecies();
      expect(validSpecies).toContain(species);
    }
  });
});

describe('getMapTileEffect - complete species-terrain matrix', () => {
  const allSpecies = Object.values(Character);
  const allTileTypes: (TileType | undefined)[] = [
    TileType.Void,
    TileType.Water,
    TileType.Fire,
    TileType.Rock,
    TileType.Sand,
    TileType.Grass,
    undefined,
  ];

  it.each(allSpecies)('returns a number for %s across all tile types', (species) => {
    allTileTypes.forEach((tileType) => {
      const result = getMapTileEffect({ species, tileType });
      expect(typeof result).toBe('number');
    });
  });

  // Baseline values (no species buff): Fire=-50, Water=-5, Grass=50, others=0
  describe('baseline effects (non-special species)', () => {
    it.each([Character.Bunny, Character.Elephant, Character.Dog, Character.Cat, Character.Unicorn])(
      '%s gets standard tile effects',
      (species) => {
        expect(getMapTileEffect({ species, tileType: TileType.Fire })).toBe(-50);
        expect(getMapTileEffect({ species, tileType: TileType.Water })).toBe(-5);
        expect(getMapTileEffect({ species, tileType: TileType.Grass })).toBe(50);
        expect(getMapTileEffect({ species, tileType: TileType.Rock })).toBe(0);
        expect(getMapTileEffect({ species, tileType: TileType.Sand })).toBe(0);
        expect(getMapTileEffect({ species, tileType: TileType.Void })).toBe(0);
        expect(getMapTileEffect({ species, tileType: undefined })).toBe(0);
      }
    );
  });

  describe('Turtle species buffs', () => {
    it('gets Water bonus (+10): -5 + 10 = 5', () => {
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Water })).toBe(5);
    });

    it('gets extra Fire penalty (-10): -50 + (-10) = -60', () => {
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Fire })).toBe(-60);
    });

    it('gets standard effects on other tiles', () => {
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Grass })).toBe(50);
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Rock })).toBe(0);
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Sand })).toBe(0);
      expect(getMapTileEffect({ species: Character.Turtle, tileType: TileType.Void })).toBe(0);
      expect(getMapTileEffect({ species: Character.Turtle, tileType: undefined })).toBe(0);
    });
  });

  describe('Lizard species buffs', () => {
    it('gets Fire reduction (+5): -50 + 5 = -45', () => {
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Fire })).toBe(-45);
    });

    it('gets Sand bonus (+5): 0 + 5 = 5', () => {
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Sand })).toBe(5);
    });

    it('gets standard effects on other tiles', () => {
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Water })).toBe(-5);
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Grass })).toBe(50);
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Rock })).toBe(0);
      expect(getMapTileEffect({ species: Character.Lizard, tileType: TileType.Void })).toBe(0);
      expect(getMapTileEffect({ species: Character.Lizard, tileType: undefined })).toBe(0);
    });
  });
});
