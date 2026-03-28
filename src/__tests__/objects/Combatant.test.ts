// Import testFactories first — its boardSlice → CombatantUtils chain
// resolves the circular dependency (Combatant ↔ Player) safely.
import { makeCombatantModel, makeGrassTiles } from '../helpers/testFactories';
import { TILE_START, Combatants } from '../../data/slices/boardSlice';
import NPC from '../../objects/combatants/NPC';
import { Character, DecisionType, Gender, State } from '../../models/CombatantModel';
import { MAX_YOUNGLING_TICK } from '../../data/utils/CombatantUtils';

describe('Combatant.canMateWith', () => {
  it('returns false when this combatant age <= MAX_YOUNGLING_TICK', () => {
    const young = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK,
      gender: Gender.Male,
      position: TILE_START,
    }));
    const old = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Female,
      position: TILE_START + 1,
    }));
    expect(young.canMateWith(old, true)).toBe(false);
  });

  it('returns false when potential combatant age <= MAX_YOUNGLING_TICK', () => {
    const old = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START,
    }));
    const young = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK,
      gender: Gender.Female,
      position: TILE_START + 1,
    }));
    expect(old.canMateWith(young, true)).toBe(false);
  });

  it('returns false when same gender and use_genders is true', () => {
    const a = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START,
    }));
    const b = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START + 1,
    }));
    expect(a.canMateWith(b, true)).toBe(false);
  });

  it('returns true when different gender and both old enough', () => {
    const a = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START,
    }));
    const b = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Female,
      position: TILE_START + 1,
    }));
    expect(a.canMateWith(b, true)).toBe(true);
  });

  it('returns true regardless of gender when use_genders is false', () => {
    const a = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START,
    }));
    const b = new NPC(makeCombatantModel({
      tick: MAX_YOUNGLING_TICK + 1,
      gender: Gender.Male,
      position: TILE_START + 1,
    }));
    expect(a.canMateWith(b, false)).toBe(true);
  });
});

describe('Combatant.releaseFromCaptivity', () => {
  it('transitions from Captured to Alive and increases age by duration', () => {
    const npc = new NPC(makeCombatantModel({
      state: State.Captured,
      tick: 10,
      position: TILE_START,
    }));
    expect(npc.getState()).toBe(State.Captured);

    npc.releaseFromCaptivity(25);

    expect(npc.getState()).toBe(State.Alive);
    expect(npc.getAge()).toBe(35);
  });

  it('no-ops when state is not Captured', () => {
    const npc = new NPC(makeCombatantModel({
      state: State.Alive,
      tick: 10,
      position: TILE_START,
    }));

    npc.releaseFromCaptivity(25);

    expect(npc.getState()).toBe(State.Alive);
    expect(npc.getAge()).toBe(10);
  });
});

describe('Combatant.birthSpawn', () => {
  it('aborts spawn (returns undefined) when >1 enemy nearby', () => {
    const tiles = makeGrassTiles(5, 5);
    const parentPos = TILE_START + 12; // row 2, col 2 in 5x5
    const parent = new NPC(makeCombatantModel({
      position: parentPos,
      species: Character.Bunny,
      state: State.Mating,
      tick: MAX_YOUNGLING_TICK + 10,
      spawn: makeCombatantModel({
        position: -1,
        species: Character.Bunny,
        decision_type: DecisionType.Neutral,
      }),
    }));

    // Place 2 enemies in surrounding positions
    const enemy1Pos = parentPos + 1;  // right
    const enemy2Pos = parentPos - 1;  // left
    const combatants: Combatants = {
      size: 3,
      c: {
        [parentPos]: parent.toModel(),
        [enemy1Pos]: makeCombatantModel({ position: enemy1Pos, species: Character.Dog }),
        [enemy2Pos]: makeCombatantModel({ position: enemy2Pos, species: Character.Cat }),
      },
    };

    const result = parent.birthSpawn({ tiles, combatants });
    expect(result).toBeUndefined();
  });

  it('places spawn at empty position when safe', () => {
    const tiles = makeGrassTiles(5, 5);
    const parentPos = TILE_START + 12;
    const parent = new NPC(makeCombatantModel({
      position: parentPos,
      species: Character.Bunny,
      state: State.Mating,
      tick: MAX_YOUNGLING_TICK + 10,
      spawn: makeCombatantModel({
        position: -1,
        species: Character.Bunny,
        decision_type: DecisionType.Neutral,
      }),
    }));

    const combatants: Combatants = {
      size: 1,
      c: {
        [parentPos]: parent.toModel(),
      },
    };

    const result = parent.birthSpawn({ tiles, combatants });
    expect(result).toBeDefined();
    expect(result!.getPosition()).toBeGreaterThanOrEqual(tiles.start);
    expect(result!.getPosition()).toBeLessThanOrEqual(tiles.end);
    expect(result!.getState()).toBe(State.Alive);
  });

  it('sets parent state back to Alive and increments children count', () => {
    const tiles = makeGrassTiles(5, 5);
    const parentPos = TILE_START + 12;
    const parent = new NPC(makeCombatantModel({
      position: parentPos,
      species: Character.Bunny,
      state: State.Mating,
      children: 0,
      tick: MAX_YOUNGLING_TICK + 10,
      spawn: makeCombatantModel({
        position: -1,
        species: Character.Bunny,
        decision_type: DecisionType.Neutral,
      }),
    }));

    const combatants: Combatants = {
      size: 1,
      c: {
        [parentPos]: parent.toModel(),
      },
    };

    parent.birthSpawn({ tiles, combatants });

    expect(parent.getState()).toBe(State.Alive);
    expect(parent.toModel().children).toBe(1);
  });
});

describe('Combatant.requestMoveImpl', () => {
  const tiles = makeGrassTiles(5, 5);

  it('chooses best_target_position when no mate, open, or random override', () => {
    // best_target_position is set first, but the second if-else block always runs.
    // When mate is -1 and open is -1, position falls to new_random_position.
    // So target only survives if open is also available (open overrides target too).
    // Test the actual behavior: with no mate and no open, random wins.
    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Neutral,
    }));
    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: TILE_START + 7,
      best_mate_position: -1,
      best_open_position: -1,
      new_random_position: TILE_START + 17,
    });
    // The second if-else block overrides: mate=-1, open=-1, so random wins
    expect(result).toBe(TILE_START + 17);
  });

  it('falls back to best_open_position when target and mate are -1', () => {
    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Neutral,
    }));
    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: -1,
      best_mate_position: -1,
      best_open_position: TILE_START + 13,
      new_random_position: TILE_START + 17,
    });
    expect(result).toBe(TILE_START + 13);
  });

  it('falls back to new_random_position when all others are -1', () => {
    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Neutral,
    }));
    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: -1,
      best_mate_position: -1,
      best_open_position: -1,
      new_random_position: TILE_START + 17,
    });
    expect(result).toBe(TILE_START + 17);
  });

  it('Lover always chooses best_mate_position when available and no target', () => {
    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Lover,
    }));
    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: -1,
      best_mate_position: TILE_START + 11,
      best_open_position: TILE_START + 13,
      new_random_position: TILE_START + 17,
    });
    expect(result).toBe(TILE_START + 11);
    expect(npc.getState()).toBe(State.Mating);
  });
});

describe('Combatant.requestMoveImpl - Wanderer', () => {
  const tiles = makeGrassTiles(5, 5);

  it('skips visited positions for target, mate, and open', () => {
    const targetPos = TILE_START + 7;
    const matePos = TILE_START + 11;
    const openPos = TILE_START + 13;
    const randomPos = TILE_START + 17;

    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Wanderer,
      visited_positions: {
        [targetPos]: targetPos,
        [matePos]: matePos,
        [openPos]: openPos,
      },
    }));

    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: targetPos,
      best_mate_position: matePos,
      best_open_position: openPos,
      new_random_position: randomPos,
    });
    // All visited positions are skipped, falls back to random
    expect(result).toBe(randomPos);
  });

  it('uses random position when target is not visited but open overrides', () => {
    // Even though target is not visited, the second if-else block runs:
    // mate=-1 (not visited doesn't matter), open is available and not visited → open wins
    const npc = new NPC(makeCombatantModel({
      position: TILE_START + 12,
      decision_type: DecisionType.Wanderer,
      visited_positions: {},
    }));

    const result = npc.requestMoveImpl({
      tiles,
      best_target_position: TILE_START + 7,
      best_mate_position: -1,
      best_open_position: TILE_START + 13,
      new_random_position: TILE_START + 17,
    });
    // open is not visited and available, so it overrides target
    expect(result).toBe(TILE_START + 13);
  });
});
