import Player from '../../objects/combatants/Player';
import { TILE_START } from '../../data/slices/boardSlice';
import { makeGrassTiles, makeCombatantModel, makeSight } from '../helpers/testFactories';
import { State } from '../../models/CombatantModel';

describe('Player.IsOf', () => {
  it('returns true for { is_player: true }', () => {
    expect(Player.IsOf({ is_player: true })).toBe(true);
  });

  it('returns false for { is_player: false }', () => {
    expect(Player.IsOf({ is_player: false })).toBe(false);
  });

  it('returns false for {}', () => {
    expect(Player.IsOf({})).toBe(false);
  });
});

describe('Player constructor', () => {
  it('sets is_player = true on the model', () => {
    const player = new Player({ position: TILE_START });
    expect(player.toModel().is_player).toBe(true);
  });

  it('sets is_player = true even when passed is_player: false', () => {
    const player = new Player({ position: TILE_START, is_player: false });
    expect(player.toModel().is_player).toBe(true);
  });
});

describe('Player.requestMove', () => {
  const tiles = makeGrassTiles(5, 5);
  const baseSight = makeSight();

  it('returns shifted waypoint position when valid (within tile bounds)', () => {
    const targetPos = TILE_START + 1;
    const model = makeCombatantModel({
      is_player: true,
      position: TILE_START,
      target_waypoints: [targetPos],
    });
    const player = new Player(model);
    const result = player.requestMove({ sight: baseSight, tiles, window_width: 5 });
    expect(result).toBe(targetPos);
  });

  it('returns current position when waypoint is out of bounds', () => {
    const outOfBounds = tiles.end + 100;
    const model = makeCombatantModel({
      is_player: true,
      position: TILE_START + 5,
      target_waypoints: [outOfBounds],
    });
    const player = new Player(model);
    const result = player.requestMove({ sight: baseSight, tiles, window_width: 5 });
    expect(result).toBe(TILE_START + 5);
  });

  it('returns current position when waypoint is undefined', () => {
    const model = makeCombatantModel({
      is_player: true,
      position: TILE_START + 3,
      target_waypoints: [undefined as unknown as number],
    });
    const player = new Player(model);
    const result = player.requestMove({ sight: baseSight, tiles, window_width: 5 });
    expect(result).toBe(TILE_START + 3);
  });

  it('returns current position when no waypoints queued', () => {
    const model = makeCombatantModel({
      is_player: true,
      position: TILE_START + 2,
      target_waypoints: [],
    });
    const player = new Player(model);
    const result = player.requestMove({ sight: baseSight, tiles, window_width: 5 });
    expect(result).toBe(TILE_START + 2);
  });

  it('shifts (consumes) the first waypoint from the queue', () => {
    const model = makeCombatantModel({
      is_player: true,
      position: TILE_START,
      target_waypoints: [TILE_START + 1, TILE_START + 2],
    });
    const player = new Player(model);
    player.requestMove({ sight: baseSight, tiles, window_width: 5 });
    expect(player.toModel().target_waypoints).toEqual([TILE_START + 2]);
  });
});
