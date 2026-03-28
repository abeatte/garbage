// Import Player first to resolve circular dependency chain
// (Player → Combatant → CombatantModel → CombatantUtils → Player is resolved when Player is entry)
import Player from '../../objects/combatants/Player';
import Seeker from '../../objects/combatants/Seeker';
import NPC from '../../objects/combatants/NPC';
import { TILE_START } from '../../data/slices/boardSlice';
import { makeCombatantModel } from '../helpers/testFactories';
import { DecisionType } from '../../models/CombatantModel';

describe('NPC.IsOf', () => {
  it('returns true when position !== undefined', () => {
    expect(NPC.IsOf({ position: TILE_START })).toBe(true);
  });

  it('returns true for position 0', () => {
    expect(NPC.IsOf({ position: 0 })).toBe(true);
  });

  it('returns false when position is undefined', () => {
    expect(NPC.IsOf({})).toBe(false);
  });

  it('returns false when position is explicitly undefined', () => {
    expect(NPC.IsOf({ position: undefined })).toBe(false);
  });
});

describe('NPC as catch-all in GetCombatant factory ordering', () => {
  it('non-player, non-seeker model with position matches NPC (and not Player or Seeker)', () => {
    const model = makeCombatantModel({
      is_player: false,
      decision_type: DecisionType.Neutral,
      position: TILE_START,
    });
    // Verify the factory ordering: Player.IsOf and Seeker.IsOf reject, NPC.IsOf accepts
    expect(Player.IsOf(model)).toBe(false);
    expect(Seeker.IsOf(model)).toBe(false);
    expect(NPC.IsOf(model)).toBe(true);
  });

  it('Fighter decision type falls through to NPC (not Player, not Seeker)', () => {
    const model = makeCombatantModel({
      is_player: false,
      decision_type: DecisionType.Fighter,
      position: TILE_START,
    });
    expect(Player.IsOf(model)).toBe(false);
    expect(Seeker.IsOf(model)).toBe(false);
    expect(NPC.IsOf(model)).toBe(true);
  });

  it('Wanderer decision type falls through to NPC (not Player, not Seeker)', () => {
    const model = makeCombatantModel({
      is_player: false,
      decision_type: DecisionType.Wanderer,
      position: TILE_START,
    });
    expect(Player.IsOf(model)).toBe(false);
    expect(Seeker.IsOf(model)).toBe(false);
    expect(NPC.IsOf(model)).toBe(true);
  });
});
