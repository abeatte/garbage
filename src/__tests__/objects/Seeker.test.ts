import Seeker from '../../objects/combatants/Seeker';
import { TILE_START } from '../../data/slices/boardSlice';
import { makeGrassTiles, makeCombatantModel } from '../helpers/testFactories';
import { DecisionType, State } from '../../models/CombatantModel';

describe('Seeker.IsOf', () => {
  it('returns true for { decision_type: DecisionType.Seeker }', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Seeker })).toBe(true);
  });

  it('returns false for DecisionType.Fighter', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Fighter })).toBe(false);
  });

  it('returns false for DecisionType.Neutral', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Neutral })).toBe(false);
  });

  it('returns false for DecisionType.Lover', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Lover })).toBe(false);
  });

  it('returns false for DecisionType.Wanderer', () => {
    expect(Seeker.IsOf({ decision_type: DecisionType.Wanderer })).toBe(false);
  });

  it('returns false for {}', () => {
    expect(Seeker.IsOf({})).toBe(false);
  });
});

describe('Seeker.beBorn', () => {
  it('sets state to Alive and pushes position to target_waypoints', () => {
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      state: State.Dead,
      target_waypoints: [],
    });
    const seeker = new Seeker(model);
    const spawnPos = TILE_START + 7;

    seeker.beBorn(spawnPos, []);

    expect(seeker.getState()).toBe(State.Alive);
    expect(seeker.toModel().target_waypoints).toContain(spawnPos);
  });
});

describe('Seeker.getSpawnDecisionType', () => {
  it('always returns DecisionType.Seeker', () => {
    const model = makeCombatantModel({ decision_type: DecisionType.Seeker });
    const seeker = new Seeker(model);
    // Call multiple times to confirm it's deterministic
    expect(seeker.getSpawnDecisionType()).toBe(DecisionType.Seeker);
    expect(seeker.getSpawnDecisionType()).toBe(DecisionType.Seeker);
    expect(seeker.getSpawnDecisionType()).toBe(DecisionType.Seeker);
  });
});

describe('Seeker.requestMoveImpl (basic strategy)', () => {
  const tiles = makeGrassTiles(5, 5);

  // Seeker.requestMoveImpl ignores these args and delegates to basic() which only uses tiles
  const dummyArgs = {
    best_target_position: -1,
    best_mate_position: -1,
    best_open_position: -1,
    new_random_position: TILE_START,
  };

  it('follows target waypoint toward destination', () => {
    // Place seeker at top-left, target at bottom-right area
    const startPos = TILE_START;
    const targetPos = TILE_START + 24; // bottom-right of 5x5
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      position: startPos,
      target_waypoints: [targetPos],
    });
    const seeker = new Seeker(model);

    const result = seeker.requestMoveImpl({ tiles, ...dummyArgs });

    // Seeker should move toward the target (not stay in place)
    // moveTowardPosition will move either +1 (right) or +5 (down)
    expect(result === startPos + 1 || result === startPos + tiles.width).toBe(true);
    // target_waypoints should still contain the target since basic() reads [0] without shifting
    expect(seeker.toModel().target_waypoints[0]).toBe(targetPos);
  });

  it('picks new random target when current target equals current position', () => {
    const pos = TILE_START + 12;
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      position: pos,
      target_waypoints: [pos], // already at target
    });
    const seeker = new Seeker(model);

    seeker.requestMoveImpl({ tiles, ...dummyArgs });

    // After reaching target, basic() should assign a new random target
    const newWaypoints = seeker.toModel().target_waypoints;
    expect(newWaypoints.length).toBe(1);
    // New target should be within tile bounds
    expect(newWaypoints[0]).toBeGreaterThanOrEqual(tiles.start);
    expect(newWaypoints[0]).toBeLessThanOrEqual(tiles.end);
  });

  it('picks new random target when current target is undefined (no waypoints)', () => {
    const pos = TILE_START + 6;
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      position: pos,
      target_waypoints: [],
    });
    const seeker = new Seeker(model);

    seeker.requestMoveImpl({ tiles, ...dummyArgs });

    // basic() should have assigned a new random target
    const newWaypoints = seeker.toModel().target_waypoints;
    expect(newWaypoints.length).toBe(1);
    expect(newWaypoints[0]).toBeGreaterThanOrEqual(tiles.start);
    expect(newWaypoints[0]).toBeLessThanOrEqual(tiles.end);
  });

  it('picks new random target when current target is invalid (out of bounds)', () => {
    const pos = TILE_START + 6;
    const invalidTarget = tiles.end + 100;
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      position: pos,
      target_waypoints: [invalidTarget],
    });
    const seeker = new Seeker(model);

    seeker.requestMoveImpl({ tiles, ...dummyArgs });

    // basic() should have replaced the invalid target with a new random one
    const newWaypoints = seeker.toModel().target_waypoints;
    expect(newWaypoints.length).toBe(1);
    expect(newWaypoints[0]).toBeGreaterThanOrEqual(tiles.start);
    expect(newWaypoints[0]).toBeLessThanOrEqual(tiles.end);
  });

  it('resets target when movement hits a wall (position unchanged)', () => {
    // Use a 1x1 grid so there's nowhere to go
    const tinyTiles = makeGrassTiles(1, 1);
    const pos = TILE_START;
    const targetPos = TILE_START; // will trigger "already got there" → new random
    const model = makeCombatantModel({
      decision_type: DecisionType.Seeker,
      position: pos,
      target_waypoints: [targetPos],
    });
    const seeker = new Seeker(model);

    const result = seeker.requestMoveImpl({ tiles: tinyTiles, ...dummyArgs });

    // On a 1x1 grid, seeker can't move anywhere
    expect(result).toBe(pos);
  });
});
