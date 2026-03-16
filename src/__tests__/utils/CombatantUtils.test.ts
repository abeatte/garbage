import { GetCombatant, killAndCopy, addItemToBoard, MIN_HEALTH, MAX_YOUNGLING_TICK } from '../../data/utils/CombatantUtils';
import { Combatants, Items, TILE_START } from '../../data/slices/boardSlice';
import { State, Character, DecisionType, Gender, Strength } from '../../models/CombatantModel';
import { DEFAULT } from '../../models/GlobalCombatantStatsModel';
import Player from '../../objects/combatants/Player';
import NPC from '../../objects/combatants/NPC';
import { Type as ItemType, DEFAULT_ITEM, ItemState } from '../../objects/items/Item';

const makeTiles = () => ({
  width: 5,
  height: 5,
  start: TILE_START,
  end: TILE_START + 24,
  size: 25,
  t: Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      TILE_START + i,
      { index: TILE_START + i, type: 'Grass', score_potential: {} },
    ])
  ),
});

describe('GetCombatant', () => {
  it('returns undefined for undefined model', () => {
    expect(GetCombatant(undefined)).toBeUndefined();
  });

  it('returns Player for is_player model', () => {
    const c = GetCombatant({ is_player: true, position: TILE_START });
    expect(c).toBeInstanceOf(Player);
  });

  it('returns NPC for position-only model', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c).toBeInstanceOf(NPC);
  });

  it('throws for unrecognized model', () => {
    expect(() => GetCombatant({} as any)).toThrow();
  });
});

describe('killAndCopy', () => {
  it('removes specified positions', () => {
    const combatants: Combatants = {
      size: 2,
      c: {
        [TILE_START]: { id: 'a', position: TILE_START } as any,
        [TILE_START + 1]: { id: 'b', position: TILE_START + 1 } as any,
      },
    };
    const result = killAndCopy({ positions: [TILE_START], combatants });
    expect(result.c[TILE_START]).toBeUndefined();
    expect(result.c[TILE_START + 1]).toBeDefined();
    expect(result.size).toBe(1);
  });

  it('returns empty combatants when all removed', () => {
    const combatants: Combatants = {
      size: 1,
      c: { [TILE_START]: { id: 'a', position: TILE_START } as any },
    };
    const result = killAndCopy({ positions: [TILE_START], combatants });
    expect(result.size).toBe(0);
  });
});

describe('addItemToBoard', () => {
  it('adds item to empty tile', () => {
    const items: Items = { size: 0, i: {} };
    const item = { getPosition: () => TILE_START, toModel: () => ({ ...DEFAULT_ITEM, position: TILE_START, type: ItemType.Bomb, state: ItemState.Live }) } as any;
    addItemToBoard(item, items);
    expect(items.i[TILE_START]).toHaveLength(1);
    expect(items.size).toBe(1);
  });

  it('caps at MAX_TILE_ITEM_COUNT (4) by shifting oldest', () => {
    const items: Items = { size: 4, i: { [TILE_START]: [] } };
    for (let i = 0; i < 4; i++) {
      items.i[TILE_START].push({ ...DEFAULT_ITEM, id: `item_${i}`, position: TILE_START, type: ItemType.Bomb, state: ItemState.Live });
    }
    const newItem = { getPosition: () => TILE_START, toModel: () => ({ ...DEFAULT_ITEM, id: 'new', position: TILE_START, type: ItemType.MedPack, state: ItemState.Live }) } as any;
    addItemToBoard(newItem, items);
    expect(items.i[TILE_START]).toHaveLength(4);
    expect(items.i[TILE_START][3].id).toBe('new');
  });
});

describe('Combatant object', () => {
  it('starts alive', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c!.getState()).toBe(State.Alive);
    expect(c!.isDead()).toBe(false);
  });

  it('kill sets state to Dead', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.kill();
    expect(c!.isDead()).toBe(true);
  });

  it('affectFitness kills when below MIN_HEALTH', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.affectFitness(MIN_HEALTH - 1);
    expect(c!.isDead()).toBe(true);
  });

  it('fightWith - higher fitness wins', () => {
    const winner = GetCombatant({ position: TILE_START, fitness: 100 });
    const loser = GetCombatant({ position: TILE_START + 1, fitness: 0 });
    const result = winner!.fightWith(loser!);
    expect(result.getID()).toBe(winner!.getID());
    expect(loser!.isDead()).toBe(true);
  });

  it('fightWith - lower fitness loses', () => {
    const weak = GetCombatant({ position: TILE_START, fitness: 0 });
    const strong = GetCombatant({ position: TILE_START + 1, fitness: 100 });
    const result = weak!.fightWith(strong!);
    expect(result.getID()).toBe(strong!.getID());
    expect(weak!.isDead()).toBe(true);
  });

  it('tick increments age', () => {
    const c = GetCombatant({ position: TILE_START });
    expect(c!.getAge()).toBe(0);
    c!.tick();
    expect(c!.getAge()).toBe(1);
  });

  it('isYoung returns false when age <= MAX_YOUNGLING_TICK', () => {
    const c = GetCombatant({ position: TILE_START, tick: 0 });
    // isYoung returns getAge() > MAX_YOUNGLING_TICK
    expect(c!.isYoung()).toBe(false);
  });

  it('isYoung returns true when age > MAX_YOUNGLING_TICK', () => {
    const c = GetCombatant({ position: TILE_START, tick: MAX_YOUNGLING_TICK + 1 });
    expect(c!.isYoung()).toBe(true);
  });

  it('capture sets state to Captured and position to -1', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.capture();
    expect(c!.isCaptured()).toBe(true);
    expect(c!.getPosition()).toBe(-1);
  });

  it('setImmortal makes getFitness return Infinity', () => {
    const c = GetCombatant({ position: TILE_START });
    c!.setImmortal(true, DEFAULT);
    expect(c!.getFitness()).toBe(Infinity);
    expect(c!.isImmortal()).toBe(true);
  });
});
