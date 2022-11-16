import { Combatants } from "./boardSlice";
import CombatantModel, { createCombatant, getRandomTeam, requestMove } from "../models/CombatantModel";
import { getInitGlobalCombatantStatsModel, getStrengthRating, GlobalCombatantStatsModel } from "../models/GlobalCombatantStatsModel";
import { TileModel } from "../models/TileModel";

export const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};
export const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export enum PosDataKey {
    tr = 'tr', t = 't', tl = 'tl', 
    r = 'r', c = 'c', l = 'l', 
    br = 'br', b = 'b', bl = 'bl'
};
export interface PosData {
    coord: {x: number, y: number},
    can_go_left: boolean,
    can_go_up: boolean,
    can_go_right: boolean,
    can_go_down: boolean,
    positions: {[key in PosDataKey]: number},
    tiles: {[key in PosDataKey]: TileModel},
    combatants: {[key in PosDataKey]: CombatantModel | undefined},
    position_scores: {[key in PosDataKey]: number}
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
            const can_move_up = posData.can_go_up && !posData.combatants.t;
            const can_move_diag = posData.can_go_left && posData.can_go_up && !posData.combatants.tl;
            const can_move_left = posData.can_go_left && !posData.combatants.l;

            const dice_roll = Math.random();

            if (dice_roll < .33 && can_move_left && dif_col > -1) {
                new_pos = posData.positions.l;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (dice_roll < .66 && can_move_up && dif_row > -1) {
                new_pos = posData.positions.t;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (can_move_diag) {
                new_pos = posData.positions.tl;
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
    const {positions, combatants} = posData;
    const self = combatants[PosDataKey.c] as CombatantModel;
    const nearby_friends = [];
    const nearby_enemies = [];
    const empty_space = [] as PosDataKey[];

    Object.keys(combatants).forEach(key => {
        const ck = key as PosDataKey;
        const c = combatants[ck];

        if (!c) {
            if (positions[ck] > -1 && positions[ck] < arena_size) {
                empty_space.push(ck)
            }
        } else if (c.team === self.team) {
            nearby_friends.push(c);
        } else {
            nearby_enemies.push(c);
        }
    });

    let spawn = undefined;
    if (nearby_enemies.length > 1) {
        // too dangerous, nothing happens
    } else {
        // safe, let's do it!
        const spawn_pos = positions[empty_space[Math.round(Math.random() * (empty_space.length - 1))]];
        delete self.spawning?.spawning;
        delete self.spawning;
        live_combatants[spawn_pos] = createCombatant({spawn_position: spawn_pos, global_combatant_stats});
        // too many of my kind here, let's diverge
        live_combatants[spawn_pos].team = nearby_friends.length < 4 ? self.team : getRandomTeam();

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
    const ret = {positions: {}, tiles: {}, combatants: {}, position_scores: {}} as PosData;

    ret.coord = {y: Math.floor(position / window_width), x: position % window_width};
    ret.can_go_left = position % window_width > 0;
    ret.can_go_up = position - window_width > -1
    ret.can_go_right = position % window_width < window_width - 1;
    ret.can_go_down = position + window_width < tiles.length;  


    ret.positions.tr = position - window_width + 1;
    ret.positions.t = position - window_width;
    ret.positions.tl = position - window_width - 1
    ret.positions.r = position + 1;
    ret.positions.c = position;
    ret.positions.l = position - 1;
    ret.positions.br = position + window_width + 1;
    ret.positions.b = position + window_width;
    ret.positions.bl = position + window_width - 1;

    ret.tiles.tr = tiles[ret.positions.tr];
    ret.tiles.t = tiles[ret.positions.t];
    ret.tiles.tl = tiles[ret.positions.tl];
    ret.tiles.l = tiles[ret.positions.l];
    ret.tiles.c = tiles[ret.positions.c];
    ret.tiles.r = tiles[ret.positions.r];
    ret.tiles.br = tiles[ret.positions.br];
    ret.tiles.b = tiles[ret.positions.b];
    ret.tiles.bl = tiles[ret.positions.bl];

    ret.combatants.tr = combatants[ret.positions.tr];
    ret.combatants.t = combatants[ret.positions.t];
    ret.combatants.tl = combatants[ret.positions.tl];
    ret.combatants.l = combatants[ret.positions.l];
    ret.combatants.c = combatants[ret.positions.c];
    ret.combatants.r = combatants[ret.positions.r];
    ret.combatants.br = combatants[ret.positions.br];
    ret.combatants.b = combatants[ret.positions.b];
    ret.combatants.bl = combatants[ret.positions.bl];

    return ret;
};
