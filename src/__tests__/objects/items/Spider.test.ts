import {
  makeSight,
  emptyItems,
  makeGrassTiles,
  makeItemModel,
} from '../../helpers/testFactories';
import { TILE_START } from '../../../data/slices/boardSlice';
import Spider from '../../../objects/items/Spider';
import { Type, SpiderType, ItemType } from '../../../objects/items/Item';
import { Type as TileType } from '../../../models/TileModel';
import { emptyCombatants } from '../../helpers/testFactories';

describe('Spider.IsOf', () => {
  it('returns true for WaterSpider', () => {
    expect(Spider.IsOf({ type: SpiderType.WaterSpider })).toBe(true);
  });

  it('returns true for FireSpider', () => {
    expect(Spider.IsOf({ type: SpiderType.FireSpider })).toBe(true);
  });

  it('returns true for RockSpider', () => {
    expect(Spider.IsOf({ type: SpiderType.RockSpider })).toBe(true);
  });

  it('returns true for SandSpider', () => {
    expect(Spider.IsOf({ type: SpiderType.SandSpider })).toBe(true);
  });

  it('returns true for GrassSpider', () => {
    expect(Spider.IsOf({ type: SpiderType.GrassSpider })).toBe(true);
  });

  it('returns false for Bomb type', () => {
    expect(Spider.IsOf({ type: Type.Bomb })).toBe(false);
  });

  it('returns false for MedPack type', () => {
    expect(Spider.IsOf({ type: Type.MedPack })).toBe(false);
  });

  it('returns false for PokemonBall type', () => {
    expect(Spider.IsOf({ type: Type.PokemonBall })).toBe(false);
  });
});

describe('Spider.getActionType', () => {
  it('maps WaterSpider to Water', () => {
    const spider = new Spider(makeItemModel(SpiderType.WaterSpider as ItemType));
    expect(spider.getActionType()).toBe(TileType.Water);
  });

  it('maps FireSpider to Fire', () => {
    const spider = new Spider(makeItemModel(SpiderType.FireSpider as ItemType));
    expect(spider.getActionType()).toBe(TileType.Fire);
  });

  it('maps RockSpider to Rock', () => {
    const spider = new Spider(makeItemModel(SpiderType.RockSpider as ItemType));
    expect(spider.getActionType()).toBe(TileType.Rock);
  });

  it('maps SandSpider to Sand', () => {
    const spider = new Spider(makeItemModel(SpiderType.SandSpider as ItemType));
    expect(spider.getActionType()).toBe(TileType.Sand);
  });

  it('maps GrassSpider to Grass', () => {
    const spider = new Spider(makeItemModel(SpiderType.GrassSpider as ItemType));
    expect(spider.getActionType()).toBe(TileType.Grass);
  });
});

describe('Spider fuse_length', () => {
  const spiderTypes: SpiderType[] = [
    SpiderType.WaterSpider,
    SpiderType.FireSpider,
    SpiderType.RockSpider,
    SpiderType.SandSpider,
    SpiderType.GrassSpider,
  ];

  it.each(spiderTypes)('is 25 for %s', (spiderType) => {
    const model = makeItemModel(spiderType as ItemType);
    const spider = new Spider(model);
    expect(spider.toModel().fuse_length).toBe(25);
  });
});

describe('Spider.tap before fuse-up', () => {
  it('paints current tile to spider terrain type and moves to new position', () => {
    const startPos = TILE_START + 6; // row 1, col 1 in 5x5 grid
    const newPos = TILE_START + 7;
    const model = makeItemModel(SpiderType.WaterSpider as ItemType, {
      tick: 0,
      position: startPos,
    });
    const spider = new Spider(model);
    const tiles = makeGrassTiles(5, 5);
    const items = emptyItems();
    const combatants = emptyCombatants();

    const sight = makeSight({
      getNewRandomPosition: () => newPos,
    });

    spider.tap(sight, items, combatants, tiles);

    // The tile at the spider's original position should be painted to Water
    expect(tiles.t[startPos].type).toBe(TileType.Water);

    // Spider should have moved to the new position
    expect(spider.toModel().position).toBe(newPos);

    // Spider should have been added to the board at the new position
    expect(items.i[newPos]).toBeDefined();
    expect(items.i[newPos].length).toBe(1);
    expect(items.size).toBe(1);

    // Tick should have incremented
    expect(spider.getAge()).toBe(1);
  });

  it('paints FireSpider tile to Fire type', () => {
    const startPos = TILE_START + 6;
    const newPos = TILE_START + 7;
    const model = makeItemModel(SpiderType.FireSpider as ItemType, {
      tick: 0,
      position: startPos,
    });
    const spider = new Spider(model);
    const tiles = makeGrassTiles(5, 5);
    const items = emptyItems();
    const combatants = emptyCombatants();

    const sight = makeSight({
      getNewRandomPosition: () => newPos,
    });

    spider.tap(sight, items, combatants, tiles);

    expect(tiles.t[startPos].type).toBe(TileType.Fire);
  });
});

describe('Spider.tap on fuse-up', () => {
  it('does not paint or persist (just ticks)', () => {
    const startPos = TILE_START + 6;
    const newPos = TILE_START + 7;
    const model = makeItemModel(SpiderType.WaterSpider as ItemType, {
      tick: 25,
      position: startPos,
    });
    const spider = new Spider(model);
    const tiles = makeGrassTiles(5, 5);
    const items = emptyItems();
    const combatants = emptyCombatants();

    const sight = makeSight({
      getNewRandomPosition: () => newPos,
    });

    spider.tap(sight, items, combatants, tiles);

    // Tile should NOT be painted (still Grass)
    expect(tiles.t[startPos].type).toBe(TileType.Grass);

    // Spider should NOT have been added to the board
    expect(items.size).toBe(0);

    // Spider should NOT have moved
    expect(spider.toModel().position).toBe(startPos);

    // Tick should still increment
    expect(spider.getAge()).toBe(26);
  });
});
