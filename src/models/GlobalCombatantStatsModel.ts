import { Strength } from "./CombatantModel";

export interface GlobalCombatantStatsModel {
    min_fitness: number,
    average_fitness: number,
    max_fitness: number,

    // used for calculating Strength ratings
    weak_bar: number,
    average_bar: number,

    average_position: number,

    num_combatants: number,

    births: number,
    deaths: number,
}

export function getInitGlobalCombatantStatsModel(existing_values: {births: number, deaths: number} = {births: 0, deaths: 0}): GlobalCombatantStatsModel {
    return {
        min_fitness: 0,
        average_fitness: 0,
        max_fitness: 0,
        weak_bar: 0,
        average_bar: 0,
        average_position: -1,
        num_combatants: 0,
        births: existing_values.births,
        deaths: existing_values.deaths,
    }
}

export function getStrengthRating(args: {global_combatant_stats: GlobalCombatantStatsModel, fitness: number, immortal: boolean}): keyof typeof Strength {
    if (args.immortal){
        return Strength.Immortal;
    } else if (args.fitness > args.global_combatant_stats.average_bar) {
        return Strength.Strong;
    } else if (args.fitness > args.global_combatant_stats.weak_bar) {
        return Strength.Average;
    } else {
        return Strength.Weak;
    }
}
