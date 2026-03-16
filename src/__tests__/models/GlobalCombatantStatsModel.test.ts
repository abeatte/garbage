import { getStrengthRating, DEFAULT, GlobalCombatantStatsModel } from '../../models/GlobalCombatantStatsModel';
import { Strength } from '../../models/CombatantModel';

const stats: GlobalCombatantStatsModel = {
  ...DEFAULT,
  weak_bar: 25,
  average_bar: 75,
};

describe('getStrengthRating', () => {
  it('returns Average when no global stats provided', () => {
    expect(getStrengthRating({ global_combatant_stats: undefined, fitness: 100, immortal: false })).toBe(Strength.Average);
  });

  it('returns Immortal when immortal flag is set', () => {
    expect(getStrengthRating({ global_combatant_stats: stats, fitness: 0, immortal: true })).toBe(Strength.Immortal);
  });

  it('returns Strong when fitness above average_bar', () => {
    expect(getStrengthRating({ global_combatant_stats: stats, fitness: 100, immortal: false })).toBe(Strength.Strong);
  });

  it('returns Average when fitness between weak_bar and average_bar', () => {
    expect(getStrengthRating({ global_combatant_stats: stats, fitness: 50, immortal: false })).toBe(Strength.Average);
  });

  it('returns Weak when fitness below weak_bar', () => {
    expect(getStrengthRating({ global_combatant_stats: stats, fitness: 10, immortal: false })).toBe(Strength.Weak);
  });
});
