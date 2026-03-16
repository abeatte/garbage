import { GetItem } from '../../data/utils/ItemUtils';
import { Type as ItemType, SpiderType, DEFAULT_ITEM, ItemState } from '../../objects/items/Item';
import Bomb from '../../objects/items/Bomb';
import MedPack from '../../objects/items/MedPack';
import PokemonBall from '../../objects/items/PokemonBall';
import Spider from '../../objects/items/Spider';
import { TILE_START } from '../../data/slices/boardSlice';

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
