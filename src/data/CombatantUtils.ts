import { Combatants } from "./boardSlice";
import CombatantModel, { createCombatant, getRandomTeam, requestMove } from "../models/CombatantModel";
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

interface Surroundings {
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
    surroundings: Surroundings[],
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
    args: {
        combatants: Combatants, 
        window_width: number, 
        window_height: number, 
        old_window_width: number, 
        old_window_height: number, 
        tiles: TileModel[]
    }
) {
    const {combatants, window_width, window_height, old_window_width, old_window_height, tiles} = args;
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
            const can_move_up = posData.can_go_up && !posData.surroundings[ClockFace.t].occupant;
            const can_move_diag = posData.can_go_left && posData.can_go_up && !posData.surroundings[ClockFace.tl].occupant;
            const can_move_left = posData.can_go_left && !posData.surroundings[ClockFace.l].occupant;

            const dice_roll = Math.random();

            if (dice_roll < .33 && can_move_left && dif_col > -1) {
                new_pos = posData.surroundings[ClockFace.l].position;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (dice_roll < .66 && can_move_up && dif_row > -1) {
                new_pos = posData.surroundings[ClockFace.t].position;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (can_move_diag) {
                new_pos = posData.surroundings[ClockFace.tl].position;
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

export function calcMovements(args: 
    {combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel, window_width: number, tiles: TileModel[]}): 
{combatants: Combatants, births: number, deaths: number} {
    const {combatants, global_combatant_stats, window_width, tiles} = args;
    const new_combatants = {} as Combatants;
    let births = 0, deaths = 0;
    Object.keys(combatants).forEach((position) => {
        const combatant = combatants[position as unknown as number];
        const current_position = parseInt(position);
        const new_position = requestMove({combatant, tiles, window_width, combatants});

        const occupient = new_combatants[new_position];
        if (!evalHealth(combatant)) {
            // you die
            deaths++;
        } else if (!occupient) {
            // space is empty; OK to move there if you are healthy enough
            new_combatants[new_position] = combatant;
            combatant.position = new_position;
        } else if(occupient.team === combatant.team) {                
            new_combatants[current_position] = combatant;
            combatant.position = current_position;
            
            // space is occupied by a friendly
            if (occupient.tick > MAX_YOUNGLING_TICK && combatant.tick > MAX_YOUNGLING_TICK) {
                combatant.spawning = occupient;
                occupient.spawning = combatant;
                const spawn = spawnNextGen({
                    posData:
                        getSurroundingPos({
                            position: new_position, 
                            window_width, 
                            tiles, 
                            combatants: new_combatants
                        }), 
                    global_combatant_stats: global_combatant_stats,
                    live_combatants: new_combatants, 
                    arena_size: tiles.length});
                if (!!spawn) {
                    combatant.children += 1;
                    occupient.children += 1;
                    births++
                }
            }
        } else {
            // space is occupied by a foe
            new_combatants[new_position] = compete(combatant, occupient)
            new_combatants[new_position].position = new_position;
            deaths++;
        }
    });

    return {combatants: new_combatants, births, deaths};
}

export function updateCombatants(args: 
    {combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel, window_width: number, tiles: TileModel[]}):
GlobalCombatantStatsModel {
    const {combatants, global_combatant_stats, tiles} = args;
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

function spawnNextGen(args: 
    {posData: PosData, live_combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel, arena_size: number}): 
CombatantModel | undefined {
    const {posData, live_combatants, global_combatant_stats, arena_size} = args;
    const {surroundings} = posData;
    const self = surroundings[ClockFace.c].occupant as CombatantModel;
    const friendly_positions = [], 
    enemy_positions = [], 
    empty_positions = [] as number[];

    surroundings.forEach((surrounding, idx, s_arr) => {
        const {position, occupant: c} = surrounding;

        if (!c) {
            if (position > -1 && position < arena_size) {
                empty_positions.push(position)
            }
        } else if (c.team === self.team) {
            friendly_positions.push(c);
        } else {
            enemy_positions.push(c);
        }
    });

    let spawn = undefined;
    if (enemy_positions.length > 1) {
        // too dangerous, nothing happens
    } else {
        // safe, let's do it!
        const spawn_pos = empty_positions[Math.round(Math.random() * (empty_positions.length - 1))];
        delete self.spawning?.spawning;
        delete self.spawning;
        live_combatants[spawn_pos] = createCombatant({spawn_position: spawn_pos, global_combatant_stats});
        // too many of my kind here, let's diverge
        live_combatants[spawn_pos].team = friendly_positions.length < 4 ? self.team : getRandomTeam();

        spawn = live_combatants[spawn_pos];
    }
    return spawn;
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
    return b_fitness > a_fitness ? b: a;
}

export function getSurroundingPos(args: {position: number, window_width: number, tiles: TileModel[], combatants: Combatants}): PosData {
    const {position, window_width, tiles, combatants} = args;
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
    ret.surroundings[ClockFace.c] = setSurrounding(position);
    ret.surroundings[ClockFace.tl] = setSurrounding(position - window_width - 1);
    ret.surroundings[ClockFace.t] = setSurrounding(position - window_width);
    ret.surroundings[ClockFace.tr] = setSurrounding(position - window_width + 1);
    ret.surroundings[ClockFace.r] = setSurrounding(position + 1);
    ret.surroundings[ClockFace.br] = setSurrounding(position + window_width + 1);
    ret.surroundings[ClockFace.b] = setSurrounding(position + window_width);
    ret.surroundings[ClockFace.bl] = setSurrounding(position + window_width - 1);
    ret.surroundings[ClockFace.l] = setSurrounding(position - 1);

    return ret;
};
