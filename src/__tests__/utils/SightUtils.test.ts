import { viewSurroundings } from '../../data/utils/SightUtils';
import { TILE_START } from '../../data/slices/boardSlice';
import { ClockFace, LegalMoves } from '../../data/utils/CombatantUtils';
import { makeGrassTiles, makeCombatantModel } from '../helpers/testFactories';

describe('SightUtils', () => {
  describe('viewSurroundings', () => {
    it('returns a 9-element surroundings array', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START + 12, tiles });
      expect(sight.surroundings).toHaveLength(9);
    });

    it('center tile at middle of 5x5 grid has all 8 neighbors defined', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START + 12, tiles });
      expect(sight.surroundings[ClockFace.c]).toBeDefined();
      expect(sight.surroundings[ClockFace.tl]).toBeDefined();
      expect(sight.surroundings[ClockFace.t]).toBeDefined();
      expect(sight.surroundings[ClockFace.tr]).toBeDefined();
      expect(sight.surroundings[ClockFace.r]).toBeDefined();
      expect(sight.surroundings[ClockFace.br]).toBeDefined();
      expect(sight.surroundings[ClockFace.b]).toBeDefined();
      expect(sight.surroundings[ClockFace.bl]).toBeDefined();
      expect(sight.surroundings[ClockFace.l]).toBeDefined();
    });

    it('corner position (top-left, TILE_START) has tl/t/tr/l undefined', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START, tiles });
      expect(sight.surroundings[ClockFace.tl]).toBeUndefined();
      expect(sight.surroundings[ClockFace.t]).toBeUndefined();
      expect(sight.surroundings[ClockFace.tr]).toBeUndefined();
      expect(sight.surroundings[ClockFace.l]).toBeUndefined();
      expect(sight.surroundings[ClockFace.c]).toBeDefined();
      expect(sight.surroundings[ClockFace.r]).toBeDefined();
      expect(sight.surroundings[ClockFace.b]).toBeDefined();
      expect(sight.surroundings[ClockFace.br]).toBeDefined();
    });

    it('edge position (top row middle) has tl/t/tr undefined', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START + 2, tiles });
      expect(sight.surroundings[ClockFace.tl]).toBeUndefined();
      expect(sight.surroundings[ClockFace.t]).toBeUndefined();
      expect(sight.surroundings[ClockFace.tr]).toBeUndefined();
      expect(sight.surroundings[ClockFace.c]).toBeDefined();
      expect(sight.surroundings[ClockFace.l]).toBeDefined();
      expect(sight.surroundings[ClockFace.r]).toBeDefined();
      expect(sight.surroundings[ClockFace.b]).toBeDefined();
    });

    it('occupant detection: combatant at neighboring position populates surrounding.occupant', () => {
      const tiles = makeGrassTiles(5, 5);
      const neighborPos = TILE_START + 13;
      const model = makeCombatantModel({ position: neighborPos });
      const combatants = { size: 1, c: { [neighborPos]: model } };
      const sight = viewSurroundings({ position: TILE_START + 12, tiles, combatants });
      const rightNeighbor = sight.surroundings[ClockFace.r];
      expect(rightNeighbor).toBeDefined();
      expect(rightNeighbor!.occupant).toBeDefined();
      expect(rightNeighbor!.occupant!.getID()).toBe(model.id);
    });

    it('getNewRandomPosition returns a valid position from LegalMoves', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START + 12, tiles });
      const legalPositions = LegalMoves.map(
        (move) => sight.surroundings[move]?.position
      ).filter((p): p is number => p !== undefined);
      const randomPos = sight.getNewRandomPosition();
      expect(legalPositions).toContain(randomPos);
    });

    it('boundary clamping for bottom-right corner position', () => {
      const tiles = makeGrassTiles(5, 5);
      const sight = viewSurroundings({ position: TILE_START + 24, tiles });
      expect(sight.surroundings[ClockFace.tr]).toBeUndefined();
      expect(sight.surroundings[ClockFace.r]).toBeUndefined();
      expect(sight.surroundings[ClockFace.br]).toBeUndefined();
      expect(sight.surroundings[ClockFace.b]).toBeUndefined();
      expect(sight.surroundings[ClockFace.c]).toBeDefined();
      expect(sight.surroundings[ClockFace.l]).toBeDefined();
      expect(sight.surroundings[ClockFace.t]).toBeDefined();
      expect(sight.surroundings[ClockFace.tl]).toBeDefined();
    });

    it('center surrounding has correct position', () => {
      const tiles = makeGrassTiles(5, 5);
      const pos = TILE_START + 12;
      const sight = viewSurroundings({ position: pos, tiles });
      expect(sight.center).toBeDefined();
      expect(sight.center!.position).toBe(pos);
      expect(sight.surroundings[ClockFace.c]!.position).toBe(pos);
    });
  });
});
