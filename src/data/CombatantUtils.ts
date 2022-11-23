import { Combatants } from "./boardSlice";
import CombatantModel, { createCombatant, getRandomTeam, requestMove, State } from "../models/CombatantModel";
import { getInitGlobalCombatantStatsModel, getStrengthRating, GlobalCombatantStatsModel } from "../models/GlobalCombatantStatsModel";
import { TileModel } from "../models/TileModel";

export const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};
export const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export enum ClockFace {  
    c = 0, 
    tl = 1, t = 2, tr = 3, 
    r = 4,  
    br = 5, b = 6, bl = 7,
    l = 8, 
};

export interface Surroundings {
    position: number,
    occupant: CombatantModel | undefined,
    tile: TileModel | undefined,
}
    
export interface PosData {
    coord: {x: number, y: number},
    can_go_left: boolean,
    can_go_up: boolean,
    can_go_right: boolean,
    can_go_down: boolean,
    surroundings: (Surroundings | undefined)[],
}

export function initCombatantStartingPos(args: {tiles: TileModel[], combatants: Combatants}): number {
    let starting_pos = -1;
    for (let i = 0; i < 10 && starting_pos === -1; i++) {
        const potential_pos = Math.round(Math.random() * (args.tiles.length - 1));
        const potential_tile = args.tiles[potential_pos];
        if (!args.combatants[potential_pos] && potential_tile.tile_effect > -1) {
            starting_pos = potential_pos;
        }
    }

    return starting_pos;
};

export function updateCombatantsPositionsAfterResize(
{combatants, window_width, window_height, old_window_width, old_window_height, tiles}: 
    {
        combatants: Combatants, 
        window_width: number, 
        window_height: number, 
        old_window_width: number, 
        old_window_height: number, 
        tiles: TileModel[]
    }
) {
    const new_combatants = {} as Combatants;

    const dif_row = window_width - old_window_width;
    const dif_col = window_height - old_window_height;
    Object.keys(combatants).forEach(k => {
        const old_pos = k as unknown as number;
        let new_pos = k as unknown as number;
        let coord = [Math.floor(old_pos / old_window_width), old_pos % old_window_width];

        if (coord[1] >= window_width || coord[0] >= window_height) {
            // they fell off the world; let's try to move them up/left
            const posData = 
                getSurroundingPos({position: old_pos, window_width: old_window_width, tiles, combatants});
            const up_position = posData.surroundings[ClockFace.t];
            const up_left_position = posData.surroundings[ClockFace.tl];
            const left_position = posData.surroundings[ClockFace.l];

            const dice_roll = Math.random();

            if (dice_roll < .33 && left_position && dif_col > -1) {
                new_pos = left_position.position;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (dice_roll < .66 && up_position && dif_row > -1) {
                new_pos = up_position.position;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (up_left_position) {
                new_pos = up_left_position.position;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else {
                new_pos = -1;
            }
        }
        
        if (dif_row !== 0) {
            // translate old coord to new coord
            new_pos = coord[0] * window_width + coord[1];
        }

        if (new_pos > -1 && new_pos < window_width * window_height) {
            const occupient = new_combatants[new_pos];
            // tie goes to whoever got there first.
            new_combatants[new_pos] = !!occupient ? compete(occupient, combatants[old_pos]) : combatants[old_pos];
            new_combatants[new_pos].position = new_pos;
        }

    })
    return new_combatants;
}

export function calcMovements(
    {random_walk_enabled, combatants, global_combatant_stats, window_width, tiles}: 
    {
        random_walk_enabled: boolean, 
        combatants: Combatants, 
        global_combatant_stats: GlobalCombatantStatsModel, 
        window_width: number, 
        tiles: TileModel[]
    }
): {combatants: Combatants, births: number, deaths: number} {
    const new_combatants = combatants as {[position: number]: CombatantModel | undefined};
    let births = 0, deaths = 0;

    Object.values(combatants)
    .forEach((combatant) => {
        const current_position = combatant.position;
        const new_position = requestMove(
            {
                random_walk_enabled, 
                current_position, 
                tiles, 
                window_width, 
                combatants: new_combatants
            });

        const occupant = new_combatants[new_position];

        if (!evalHealth(combatant) || combatant.state === State.Dead) {
            // you die
            combatant.state = State.Dead;
            new_combatants[current_position] = undefined;
            deaths++;
        } else if (combatant.state === State.Mating) {
            // do nothing; their turn is taken up by mating
        } else if (!occupant) {
            // space is empty; OK to move
            new_combatants[current_position] = undefined;
            new_combatants[new_position] = combatant;
            combatant.position = new_position;
        } else if(occupant.team === combatant.team) {
            // space is occupied by a friendly
            if (combatant.tick > MAX_YOUNGLING_TICK && occupant.tick > MAX_YOUNGLING_TICK) {
                occupant.state = State.Mating;
                combatant.state = State.Mating;
                combatant.spawn = createCombatant({spawn_position: -1, global_combatant_stats});
            }
        } else {
            // space is occupied by a enemy
            new_combatants[current_position] = undefined;
            new_combatants[new_position] = compete(combatant, occupant);
            (new_combatants[new_position] as CombatantModel).position = new_position;
            deaths++;            
        }
    });

    Object.values(new_combatants)
        .filter(c => c?.state === State.Mating)
        .forEach(c => {
            const parent = c as CombatantModel;
            const spawn = parent.spawn as CombatantModel;
            if (spawn === undefined) {
                // congrats, dad... get lost
                parent.state = State.Alive;
                parent.children += 1;
                return;
            }
            parent.spawn = undefined;
            birthSpawn({
                posData:
                    getSurroundingPos({
                        position: parent.position,
                        window_width, 
                        tiles, 
                        combatants: new_combatants,
                    }), 
                spawn,
                parent,
                arena_size: tiles.length});
            if (spawn.position > -1) {
                new_combatants[spawn.position] = spawn;
                parent.children += 1;
                births++
            }
        });

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined combatants 
    const ret_combatants = {} as Combatants;
    Object.values(new_combatants).forEach(c => {
        if (c !== undefined) {
            ret_combatants[c.position] = c;
        }
    })

    return {combatants: ret_combatants, births, deaths};
}

export function updateCombatants({combatants, global_combatant_stats, tiles}: 
    {combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel, window_width: number, tiles: TileModel[]}):
GlobalCombatantStatsModel {
    const new_global_combatant_stats = getInitGlobalCombatantStatsModel(global_combatant_stats);

    const combatant_keys = Object.keys(combatants);
    combatant_keys.forEach(key => {
        const position = key as unknown as number;
        const combatant = combatants[position];
        if (!combatant.immortal) {
            combatant.fitness += tiles[position].tile_effect;
        }
        combatant.strength = getStrengthRating({
            global_combatant_stats, 
            fitness: combatant.fitness, 
            immortal: combatant.immortal
        });

        new_global_combatant_stats.average_position += position;
            if (new_global_combatant_stats.min_fitness > combatant.fitness) {
                new_global_combatant_stats.min_fitness = combatant.fitness;
            }
            new_global_combatant_stats.average_fitness += combatant.fitness;
            if (new_global_combatant_stats.max_fitness < combatant.fitness) {
                new_global_combatant_stats.max_fitness = combatant.fitness;
            }

        combatant.tick +=1;
    });

    const number_of_new_combatants = combatant_keys.length;
    new_global_combatant_stats.average_position = 
        new_global_combatant_stats.average_position/number_of_new_combatants;
    new_global_combatant_stats.average_fitness = 
        new_global_combatant_stats.average_fitness/number_of_new_combatants;
    new_global_combatant_stats.weak_bar = 
        (new_global_combatant_stats.average_fitness + new_global_combatant_stats.min_fitness)/2;;
    new_global_combatant_stats.average_bar = 
        (new_global_combatant_stats.average_fitness + new_global_combatant_stats.max_fitness)/2;

    return new_global_combatant_stats;
}

/**
 * @param {*} c combatant
 * @returns true if combatant should live
 */
 function evalHealth(c: CombatantModel) {
    return c.fitness > MIN_HEALTH;
};

function birthSpawn({posData, spawn, parent, arena_size}: 
    {posData: PosData, spawn: CombatantModel, parent: CombatantModel, arena_size: number})
{
    const {surroundings} = posData;
    const friendly_positions = [], 
    enemy_positions = [], 
    empty_positions = [] as number[];

    surroundings.forEach((surrounding, idx, s_arr) => {
        if (!surrounding) {
            return;
        }
        
        const {position, occupant: c} = surrounding;

        if (!c) {
            if (position > -1 && position < arena_size) {
                empty_positions.push(position)
            }
        } else if (c.team === parent.team) {
            friendly_positions.push(c);
        } else {
            enemy_positions.push(c);
        }
    });

    if (enemy_positions.length > 1) {
        // spawn dies; too dangerous
    } else {
        // safe, let's do it!
        const spawn_pos = empty_positions.length > 0 ? 
            empty_positions[Math.round(Math.random() * (empty_positions.length - 1))]:
            -1;
        if (spawn_pos > -1) {
            spawn.position = spawn_pos;
            // too many of my kind here, let's diverge
            spawn.team = friendly_positions.length < 4 ? parent.team : getRandomTeam();
        }
    }
}

/**
 * Ties go to the a_combatant (the attacker)
 * @param {*} a the attacking combatant
 * @param {*} b the defending combatant
 * @returns the fitter combatant
 */
function compete(a: CombatantModel, b: CombatantModel) {
    const a_fitness = a.immortal ? Infinity : a.fitness;
    const b_fitness = b.immortal ? Infinity : b.fitness;
    if (b_fitness > a_fitness) {
        a.state = State.Dead;
        b.kills += 1;
        return b;
    } else {
        b.state = State.Dead;
        a.kills += 1;
        return a;
    }
}

export function getSurroundingPos(
    {position, window_width, tiles, combatants}: 
    {position: number, window_width: number, tiles: TileModel[], combatants: {[position: number]: CombatantModel | undefined}}
): PosData {
    const ret = {surroundings: [] as Surroundings[]} as PosData;

    ret.coord = {y: Math.floor(position / window_width), x: position % window_width};
    ret.can_go_left = position % window_width > 0;
    ret.can_go_up = position - window_width > -1
    ret.can_go_right = position % window_width < window_width - 1;
    ret.can_go_down = position + window_width < tiles.length; 
    
    const setSurrounding = (position: number) => {
        return {
            position,
            occupant: combatants[position],
            tile: tiles[position]
        }
    }

    // start at center position and then move clockwise around
    ret.surroundings = Array(9);
    ret.surroundings[ClockFace.c] = 
        setSurrounding(position);
    ret.surroundings[ClockFace.tl] = ret.can_go_up && ret.can_go_left ? 
        setSurrounding(position - window_width - 1) : undefined;
    ret.surroundings[ClockFace.t] = ret.can_go_up ? 
        setSurrounding(position - window_width) : undefined;
    ret.surroundings[ClockFace.tr] = ret.can_go_up && ret.can_go_right ? 
        setSurrounding(position - window_width + 1) : undefined;
    ret.surroundings[ClockFace.r] = ret.can_go_right ? 
        setSurrounding(position + 1) : undefined;
    ret.surroundings[ClockFace.br] = ret.can_go_down && ret.can_go_right ? 
        setSurrounding(position + window_width + 1) : undefined;
    ret.surroundings[ClockFace.b] = ret.can_go_down ? 
        setSurrounding(position + window_width) : undefined;
    ret.surroundings[ClockFace.bl] = ret.can_go_down && ret.can_go_left ? 
        setSurrounding(position + window_width - 1) : undefined;
    ret.surroundings[ClockFace.l] = ret.can_go_left ? 
        setSurrounding(position - 1) : undefined;

    return ret;
};
