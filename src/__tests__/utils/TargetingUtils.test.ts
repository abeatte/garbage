import { getCombatantAtTarget } from '../../data/utils/TargetingUtils';
import { Combatants, TILE_START } from '../../data/slices/boardSlice';
import { State, Strength, DecisionType, Gender, Character } from '../../models/CombatantModel';

const makeCombatant = (id: string, position: number) => ({
  id,
  position,
  is_player: false,
  name: 'Test',
  state: State.Alive,
  fitness: 0,
  strength: Strength.Average,
  decision_type: DecisionType.Neutral,
  immortal: false,
  species: Character.Bunny,
  gender: Gender.Male,
  kills: 0,
  children: 0,
  tick: 0,
  target_waypoints: [],
  visited_positions: {},
  spawn: undefined,
});

describe('getCombatantAtTarget', () => {
  const combatants: Combatants = {
    size: 1,
    c: { [TILE_START + 5]: makeCombatant('npc1', TILE_START + 5) as any },
  };

  it('returns undefined for undefined target', () => {
    expect(getCombatantAtTarget({ target: undefined, player: undefined, combatants })).toBeUndefined();
  });

  it('returns undefined for negative target', () => {
    expect(getCombatantAtTarget({ target: -1, player: undefined, combatants })).toBeUndefined();
  });

  it('returns NPC at target position', () => {
    const result = getCombatantAtTarget({ target: TILE_START + 5, player: undefined, combatants });
    expect(result?.id).toBe('npc1');
  });

  it('returns player when target matches player position', () => {
    const player = makeCombatant('player1', TILE_START + 5) as any;
    player.is_player = true;
    const result = getCombatantAtTarget({ target: TILE_START + 5, player, combatants });
    expect(result?.id).toBe('player1');
  });

  it('returns undefined when no combatant at target', () => {
    const result = getCombatantAtTarget({ target: TILE_START + 99, player: undefined, combatants });
    expect(result).toBeUndefined();
  });
});
