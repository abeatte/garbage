import { GetItem, updateItemsAfterResize } from '../../data/utils/ItemUtils';
import { Type as ItemType, SpiderType, DEFAULT_ITEM, ItemState } from '../../objects/items/Item';
import Bomb from '../../objects/items/Bomb';
import MedPack from '../../objects/items/MedPack';
import PokemonBall from '../../objects/items/PokemonBall';
import Spider from '../../objects/items/Spider';
import { Items, TILE_START } from '../../data/slices/boardSlice';
import { makeGrassTiles, makeItemModel, emptyItems } from '../helpers/testFactories';
import { createTileModel, Type as TileType } from '../../models/TileModel';

const makeModel = (type: any) => ({
  ...DEFAULT_ITEM,
  id: 'test-item',
  position: TILE_START,
  type,
  state: ItemState.Live,
});

describe('GetItem', () => {
  it('returns Bomb for Bomb type', () => {
    expect(GetItem(makeModel(ItemType.Bomb))).toBeInstanceOf(Bomb);
  });

  it('returns MedPack for MedPack type', () => {
    expect(GetItem(makeModel(ItemType.MedPack))).toBeInstanceOf(MedPack);
  });

  it('returns PokemonBall for PokemonBall type', () => {
    expect(GetItem(makeModel(ItemType.PokemonBall))).toBeInstanceOf(PokemonBall);
  });

  it('returns Spider for WaterSpider type', () => {
    expect(GetItem(makeModel(SpiderType.WaterSpider))).toBeInstanceOf(Spider);
  });

  it('throws for unknown type', () => {
    expect(() => GetItem(makeModel('Unknown' as any))).toThrow();
  });
});

describe('Bomb', () => {
  it('isSpent returns false initially', () => {
    const bomb = GetItem(makeModel(ItemType.Bomb));
    expect(bomb.isSpent()).toBe(false);
  });

  it('isFuseUp returns true after fuse_length ticks', () => {
    const model = makeModel(ItemType.Bomb);
    model.tick = 3; // fuse_length for Bomb is 3
    const bomb = GetItem(model);
    expect(bomb.isFuseUp()).toBe(true);
  });
});

describe('MedPack', () => {
  it('has no fuse (fuse_length 0)', () => {
    const medpack = GetItem(makeModel(ItemType.MedPack));
    expect(medpack.isFuseUp()).toBe(false);
  });
});

describe('updateItemsAfterResize', () => {
  it('repositions items to valid coordinates after width increase', () => {
    // Start with a 5×5 grid, item at row 2, col 3 → position = TILE_START + 2*5 + 3 = TILE_START + 13
    const oldWidth = 5;
    const itemPos = TILE_START + 13; // row 2, col 3 in 5-wide grid
    const itemModel = makeItemModel(ItemType.Bomb, { position: itemPos });

    const items: Items = {
      size: 1,
      i: { [itemPos]: [itemModel] },
    };

    // Resize to 6-wide grid (same height)
    const newTiles = makeGrassTiles(6, 5);

    const result = updateItemsAfterResize({ items, old_window_width: oldWidth, tiles: newTiles });

    // row 2, col 3 in 6-wide grid → TILE_START + 2*6 + 3 = TILE_START + 15
    const expectedPos = TILE_START + 15;
    expect(result.i[expectedPos]).toBeDefined();
    expect(result.i[expectedPos].length).toBe(1);
    expect(result.i[expectedPos][0].position).toBe(expectedPos);
  });

  it('repositions items to valid coordinates after width decrease', () => {
    // Item at row 1, col 2 in a 5-wide grid → position = TILE_START + 1*5 + 2 = TILE_START + 7
    const oldWidth = 5;
    const itemPos = TILE_START + 7;
    const itemModel = makeItemModel(ItemType.MedPack, { position: itemPos });

    const items: Items = {
      size: 1,
      i: { [itemPos]: [itemModel] },
    };

    // Shrink to 4-wide grid
    const newTiles = makeGrassTiles(4, 5);

    const result = updateItemsAfterResize({ items, old_window_width: oldWidth, tiles: newTiles });

    // row 1, col 2 in 4-wide grid → TILE_START + 1*4 + 2 = TILE_START + 6
    const expectedPos = TILE_START + 6;
    expect(result.i[expectedPos]).toBeDefined();
    expect(result.i[expectedPos][0].position).toBe(expectedPos);
  });

  it('drops items on positions that become invalid after resize', () => {
    // Item at row 2, col 4 in a 5-wide grid → position = TILE_START + 14
    const oldWidth = 5;
    const itemPos = TILE_START + 14; // row 2, col 4
    const itemModel = makeItemModel(ItemType.Bomb, { position: itemPos });

    const items: Items = {
      size: 1,
      i: { [itemPos]: [itemModel] },
    };

    // Shrink to 3-wide, 3-tall grid — col 4 is out of bounds, but the function
    // clamps col to width-1. However, if the new position lands on a Void tile, it's dropped.
    // Use a grid where the translated position is Void.
    const newTiles = makeGrassTiles(3, 3);
    // row 2, col 4 → col clamped to 3-1=2, new_pos = 2*3 + 2 + TILE_START = TILE_START + 8
    // That's the last tile in a 3×3 grid (TILE_START+8), which is valid.
    // Instead, make the target tile Void so the item gets dropped.
    const clampedPos = TILE_START + 8;
    newTiles.t[clampedPos] = createTileModel({ index: clampedPos, type: TileType.Void });

    const result = updateItemsAfterResize({ items, old_window_width: oldWidth, tiles: newTiles });

    expect(result.i[clampedPos]).toBeUndefined();
    expect(result.size).toBe(0);
  });

  it('returns correct item count (size) after resize', () => {
    const oldWidth = 5;
    // Place two items at different positions
    const pos1 = TILE_START + 0; // row 0, col 0
    const pos2 = TILE_START + 6; // row 1, col 1
    const item1 = makeItemModel(ItemType.Bomb, { position: pos1 });
    const item2 = makeItemModel(ItemType.MedPack, { position: pos2 });

    const items: Items = {
      size: 2,
      i: {
        [pos1]: [item1],
        [pos2]: [item2],
      },
    };

    // Resize to 6-wide grid
    const newTiles = makeGrassTiles(6, 5);

    const result = updateItemsAfterResize({ items, old_window_width: oldWidth, tiles: newTiles });

    // Both items should survive — count their total
    expect(result.size).toBe(2);
  });

  it('handles empty items collection', () => {
    const oldWidth = 5;
    const items = emptyItems();
    const newTiles = makeGrassTiles(6, 5);

    const result = updateItemsAfterResize({ items, old_window_width: oldWidth, tiles: newTiles });

    expect(result.size).toBe(0);
    expect(Object.keys(result.i)).toHaveLength(0);
  });
});
