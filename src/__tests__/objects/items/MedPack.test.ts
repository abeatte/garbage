// Import testFactories first to resolve circular dependency safely.
import {
  makeSight,
  emptyCombatants,
  emptyItems,
  makeGrassTiles,
  makeCombatantModel,
  makeItemModel,
} from '../../helpers/testFactories';
import { TILE_START, Combatants } from '../../../data/slices/boardSlice';
import MedPack from '../../../objects/items/MedPack';
import { Type, SpiderType, ItemType } from '../../../objects/items/Item';
import { MIN_HEALTH } from '../../../data/utils/CombatantUtils';
import { createTileModel, Type as TileType } from '../../../models/TileModel';

describe('MedPack.IsOf', () => {
  it('returns true for { type: Type.MedPack }', () => {
    expect(MedPack.IsOf({ type: Type.MedPack })).toBe(true);
  });

  it('returns false for Bomb type', () => {
    expect(MedPack.IsOf({ type: Type.Bomb })).toBe(false);
  });

  it('returns false for PokemonBall type', () => {
    expect(MedPack.IsOf({ type: Type.PokemonBall })).toBe(false);
  });

  it('returns false for spider types', () => {
    expect(MedPack.IsOf({ type: SpiderType.FireSpider as ItemType })).toBe(false);
  });
});

describe('MedPack fuse_length', () => {
  it('is -1 (never fuses up)', () => {
    const model = makeItemModel(Type.MedPack);
    const medpack = new MedPack(model);
    expect(medpack.toModel().fuse_length).toBe(-1);
  });
});

describe('MedPack.tap heals center occupant', () => {
  it('heals occupant by -MIN_HEALTH (adds 500 fitness)', () => {
    const pos = TILE_START;
    const model = makeItemModel(Type.MedPack, { tick: 0, position: pos });
    const medpack = new MedPack(model);
    const tiles = makeGrassTiles(5, 5);

    const occupantModel = makeCombatantModel({ position: pos, fitness: -100 });
    const combatants: Combatants = {
      size: 1,
      c: { [pos]: occupantModel },
    };
    const items = emptyItems();

    const sight = makeSight({
      center: { position: pos, occupant: undefined, tile: tiles.t[pos] },
    });

    medpack.tap(sight, items, combatants, tiles);

    // Fitness should increase by -MIN_HEALTH (500)
    expect(occupantModel.fitness).toBe(-100 + (-MIN_HEALTH));
    // Tick should have incremented
    expect(medpack.getAge()).toBe(1);
  });
});

describe('MedPack.tap persists when no occupant', () => {
  it('calls addItemToBoard when center has no occupant', () => {
    const pos = TILE_START;
    const model = makeItemModel(Type.MedPack, { tick: 0, position: pos });
    const medpack = new MedPack(model);
    const tiles = makeGrassTiles(5, 5);
    const combatants = emptyCombatants();
    const items = emptyItems();

    const sight = makeSight({
      center: { position: pos, occupant: undefined, tile: tiles.t[pos] },
    });

    medpack.tap(sight, items, combatants, tiles);

    // Item should have been added to the board
    expect(items.i[pos]).toBeDefined();
    expect(items.i[pos].length).toBe(1);
    expect(items.size).toBe(1);
    // Tick should have incremented
    expect(medpack.getAge()).toBe(1);
  });
});

describe('MedPack.tap no-ops on invalid tile', () => {
  it('no-ops when center tile is undefined', () => {
    const pos = TILE_START;
    const model = makeItemModel(Type.MedPack, { tick: 0, position: pos });
    const medpack = new MedPack(model);
    const tiles = makeGrassTiles(5, 5);
    const combatants = emptyCombatants();
    const items = emptyItems();

    const sight = makeSight({
      center: undefined,
    });

    medpack.tap(sight, items, combatants, tiles);

    // Should not tick and should not add to board
    expect(medpack.getAge()).toBe(0);
    expect(items.size).toBe(0);
  });

  it('no-ops when center tile is Void', () => {
    const pos = TILE_START;
    const model = makeItemModel(Type.MedPack, { tick: 0, position: pos });
    const medpack = new MedPack(model);
    const tiles = makeGrassTiles(5, 5);
    const combatants = emptyCombatants();
    const items = emptyItems();

    const voidTile = createTileModel({ index: pos, type: TileType.Void });
    const sight = makeSight({
      center: { position: pos, occupant: undefined, tile: voidTile },
    });

    medpack.tap(sight, items, combatants, tiles);

    // Should not tick and should not add to board
    expect(medpack.getAge()).toBe(0);
    expect(items.size).toBe(0);
  });
});
