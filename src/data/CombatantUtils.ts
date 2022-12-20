import { Combatants, Items, MovementLogic } from "./boardSlice";
import CombatantModel, { createCombatant, DecisionType, Gender, getNewPositionFromClockFace, getRandomSpecies, requestMove, State } from "../models/CombatantModel";
import { getInitGlobalCombatantStatsModel, getStrengthRating, GlobalCombatantStatsModel } from "../models/GlobalCombatantStatsModel";
import { createTileModel, TileModel, updateMapTileScorePotentials } from "../models/TileModel";
import Brain from "../models/Brain";
import { ItemModel, Type as ItemType } from "../models/ItemModel";
import { SpiderModel } from "../models/SpiderModel";

export const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export enum ClockFace {  
    c = 0, 
    tl = 1, t = 2, tr = 3, 
    r = 4,  
    br = 5, b = 6, bl = 7,
    l = 8, 
};

export const LegalMoves = [ClockFace.c, ClockFace.t, ClockFace.r, ClockFace.b, ClockFace.l]
export const DiagonalMoves = [ClockFace.tl, ClockFace.tr, ClockFace.br, ClockFace.bl]
export const IllegalMoves = [...DiagonalMoves]

export interface Surroundings {
    position: number,
    occupant: CombatantModel | undefined,
    tile: TileModel,
}
    
export interface PosData {
    coord: {x: number, y: number},
    can_go_left: boolean,
    can_go_up: boolean,
    can_go_right: boolean,
    can_go_down: boolean,
    window_width: number,
    tile_count: number,
    min_potential: number, 
    max_potential: number,
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
            new_combatants[new_pos].visited_positions[new_pos] = new_pos;
        }

    })
    return new_combatants;
}

export function calculateCombatantMovements(
    {movement_logic, use_genders, combatants, global_combatant_stats, window_width, tiles}: 
    {
        movement_logic: MovementLogic,
        use_genders: boolean, 
        combatants: Combatants,
        global_combatant_stats: GlobalCombatantStatsModel, 
        window_width: number, 
        tiles: TileModel[]
    }
): {combatants: Combatants, births: number, deaths: number} {
    const brain = Brain.init();
    const working_combatants = combatants as {[position: number]: CombatantModel | undefined};
    let births = 0, deaths = 0;

    Object.keys(working_combatants).forEach((p) => {
        const current_position = parseInt(p);
        const combatant = working_combatants[current_position];
        if (combatant === undefined) {
            return;
        }
        const posData = getSurroundingPos(
            {
                position: current_position,
                window_width, 
                tiles, 
                combatants: working_combatants,
            }
        );
        const new_position = requestMove(
            {
                posData,
                movement_logic, 
                decision_type: combatant.decision_type,
                brain, 
                current_position, 
                tiles, 
                window_width,
            });

        const occupant = working_combatants[new_position];

        if (!evalHealth(combatant) || combatant.state === State.Dead) {
            // you die
            combatant.state = State.Dead;
            working_combatants[current_position] = undefined;
            deaths++;
        } else if (combatant.state === State.Mating) {
            // do nothing; their turn is taken up by mating
        } else if (!occupant) {
            // space is empty; OK to move
            working_combatants[current_position] = undefined;
            working_combatants[new_position] = combatant;
            combatant.position = new_position;
            combatant.visited_positions[new_position] = new_position;
        } else if(
            occupant.species === combatant.species &&
            // if a Fighter is here they're not here to mate!
            (movement_logic === MovementLogic.DecisionTree &&
            combatant.decision_type !== DecisionType.Fighter)
        ) {
            // space is occupied by a friendly
            if (
                // not yourself
                combatant.id !== occupant.id && 
                // your not too young
                combatant.tick > MAX_YOUNGLING_TICK && 
                // they're not too young
                occupant.tick > MAX_YOUNGLING_TICK &&
                (
                    // they are the correct gender (so woke! LOL)
                    combatant.gender === Gender.Unknown ||
                    occupant.gender === Gender.Unknown ||
                    combatant.gender !== occupant.gender
                )
            ) {
                    occupant.state = State.Mating;
                    combatant.state = State.Mating;
                    combatant.spawn = createCombatant({spawn_position: -1, use_genders, global_combatant_stats});
            }
        } else {
            // space is occupied by a enemy (or an ally with with a Fighter incumbent)
            working_combatants[current_position] = undefined;
            working_combatants[new_position] = compete(combatant, occupant);
            (working_combatants[new_position] as CombatantModel).position = new_position;
            (working_combatants[new_position] as CombatantModel).visited_positions[new_position] = new_position;
            deaths++;            
        }
    });

    Object.values(working_combatants)
        .filter(c => c?.state === State.Mating)
        .forEach(c => {
            const parent = c as CombatantModel;
            const spawn = parent.spawn as CombatantModel;
            parent.state = State.Alive;
            if (spawn === undefined) {
                // congrats, dad... get lost
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
                        combatants: working_combatants,
                    }), 
                spawn,
                parent,
                arena_size: tiles.length});
            if (spawn.position > -1) {
                working_combatants[spawn.position] = spawn;
                parent.children += 1;
                births++
            }
        });

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined combatants 
    const ret_combatants = {} as Combatants;
    Object.values(working_combatants).forEach(c => {
        if (c !== undefined) {
            ret_combatants[c.position] = c;
        }
    })

    return {combatants: ret_combatants, births, deaths};
}

/**
 * Handles the removing of Combatants from the Combatants object without creating undefined spaces. 
 * @returns a copy of the Combatants without the killed positions (and no undefined spaces)
 */
export function killAndCopy({positions, combatants}: {positions: number[], combatants: Combatants}): Combatants {
    return Object.values(combatants).reduce((ret_combatants, combatant, _idx, _working_combatants) => {
        if (!positions.includes(combatant.position)) {
            ret_combatants[combatant.position] = combatant;
        }
        return ret_combatants;
    }, {} as Combatants);
}

export function updateEntities({combatants, items, global_combatant_stats, window_width, tiles}: 
    {combatants: Combatants, items: Items, global_combatant_stats: GlobalCombatantStatsModel, window_width: number, tiles: TileModel[]})
: {combatants: Combatants, items: Items, tiles: TileModel[], globalCombatantStats: GlobalCombatantStatsModel} {
    const working_global_combatant_stats = getInitGlobalCombatantStatsModel(global_combatant_stats);
    const working_combatants = combatants as {[position: number]: CombatantModel | undefined};
    const working_items = items as {[position: number]: ItemModel | undefined};
    let deaths = 0;

    const item_keys = Object.keys(items);
    item_keys.forEach(key => {
        const position = key as unknown as number;
        const item = working_items[position];

        if (item === undefined) {
            return;
        }

        switch(item.type) {
            case ItemType.Bomb:
                if (item.fuse_length > 0 && item.tick === item.fuse_length) {
                    // time to blow
                    const posData = getSurroundingPos(
                        {
                            position: item.position,
                            window_width, 
                            tiles, 
                            combatants: working_combatants,
                        }
                    );
                    posData.surroundings.forEach(surrounding => {
                        const c_to_die = surrounding?.occupant;
                        if (c_to_die !== undefined) {
                            c_to_die.state = State.Dead;
                            working_combatants[c_to_die.position] = undefined;
                            deaths++;
                            item.kills +=1;
                        }
                    });
                    // remove item from board
                    working_items[item.position] = undefined;
                }
            break;
            case ItemType.PokemonBall:
                const posData = getSurroundingPos(
                    {
                        position: item.position,
                        window_width, 
                        tiles, 
                        combatants: working_combatants,
                    }
                );
                const valid_surroundings = posData.surroundings.filter(sur => sur !== undefined);
                const capacity = valid_surroundings.length;

                if (item.fuse_length > 0 && item.tick === item.fuse_length) {
                    // time to blow
                    const captives = item.captured;
                    item.captured = [];
                    while (captives.length > 0) {
                        const captive = captives.pop();
                        const surrounding = valid_surroundings.pop();
                        const occupant = surrounding?.occupant;
                        if (captive === undefined || surrounding === undefined) {
                            return;
                        }

                        if (occupant === undefined) {
                            working_combatants[surrounding.position] = captive
                            captive.position = surrounding.position;
                            captive.visited_positions[surrounding.position] = surrounding.position;
                        } else {
                            working_combatants[surrounding.position] = compete(occupant, captive);
                            (working_combatants[surrounding.position] as CombatantModel)
                                .position = surrounding.position;
                            (working_combatants[surrounding.position] as CombatantModel)
                                .visited_positions[surrounding.position] = surrounding.position;
                            deaths++;
                        }
                    }
                    // remove item from board
                    working_items[item.position] = undefined;
                } else if (item.captured.length < capacity) {
                    // can only store as many tiles as it can disgorge into
                    posData.surroundings.forEach(surrounding => {
                        const c_to_capture = surrounding?.occupant;
                        if (c_to_capture) {
                            item.captured.push(c_to_capture);
                            working_combatants[c_to_capture.position] = undefined;
                            c_to_capture.position = -1;
                        }
                    });

                    item.captured.forEach(c => {
                        c.tick += 1;
                    });
                }
            break;
            case ItemType.MedPack:
                const occupant = working_combatants[position];
                if (occupant) {
                    occupant.fitness += -MIN_HEALTH;
                    working_items[item.position] = undefined;
                }
            break;
            case ItemType.Spider:
                tiles[item.position] = 
                    createTileModel({index: item.position, type: (item as SpiderModel).tile_action});

                const clockFace = LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)];
                const new_position = getNewPositionFromClockFace(
                    item.position,
                    clockFace,
                    window_width,
                    tiles.length,
                );
                working_items[item.position] = undefined;
                if (item.fuse_length > 0 && item.tick < item.fuse_length) {
                    working_items[new_position] = item;
                    item.position = new_position;
                }
            break;
        }

        item.tick +=1;
    })

    const combatant_keys = Object.keys(working_combatants);
    combatant_keys.forEach(key => {
        const position = key as unknown as number;
        const combatant = working_combatants[position];

        if (combatant === undefined) {
            return;
        }

        if (!combatant.immortal) {
            combatant.fitness += tiles[position].tile_effect;
        }
        combatant.strength = getStrengthRating({
            global_combatant_stats, 
            fitness: combatant.fitness, 
            immortal: combatant.immortal
        });

        working_global_combatant_stats.average_position += position;
        if (working_global_combatant_stats.min_fitness > combatant.fitness) {
            working_global_combatant_stats.min_fitness = combatant.fitness;
        }
        working_global_combatant_stats.average_fitness += combatant.fitness;
        if (working_global_combatant_stats.max_fitness < combatant.fitness) {
            working_global_combatant_stats.max_fitness = combatant.fitness;
        }

        combatant.tick += 1;
    });

    working_global_combatant_stats.deaths += deaths;

    const number_of_new_combatants = combatant_keys.length;
    working_global_combatant_stats.num_combatants = 
        number_of_new_combatants;
    working_global_combatant_stats.average_position = 
        working_global_combatant_stats.average_position/number_of_new_combatants;
    working_global_combatant_stats.average_fitness = 
        working_global_combatant_stats.average_fitness/number_of_new_combatants;
    working_global_combatant_stats.weak_bar = 
        (working_global_combatant_stats.average_fitness + working_global_combatant_stats.min_fitness)/2;;
    working_global_combatant_stats.average_bar = 
        (working_global_combatant_stats.average_fitness + working_global_combatant_stats.max_fitness)/2;

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined combatants 
    const ret_combatants = {} as Combatants;
    Object.values(working_combatants).forEach(c => {
        if (c !== undefined) {
            ret_combatants[c.position] = c;
        }
    })

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined items 
    const ret_items = {} as Items;
    Object.values(working_items).forEach(i => {
        if (i !== undefined) {
            ret_items[i.position] = i;
        }
    })

    updateMapTileScorePotentials(tiles, window_width);
    return {combatants: ret_combatants, items: ret_items, tiles: tiles, globalCombatantStats: working_global_combatant_stats};
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
        } else if (c.species === parent.species) {
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
            spawn.visited_positions[spawn_pos] = spawn_pos;
            // too many of my kind here, let's diverge
            spawn.species = friendly_positions.length < 4 ? parent.species : getRandomSpecies();
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
    {
        position: number, 
        window_width: number, 
        tiles: TileModel[], 
        combatants: {[position: number]: CombatantModel | undefined}
    }
): PosData {
    const ret = {surroundings: [] as Surroundings[]} as PosData;

    ret.coord = {y: Math.floor(position / window_width), x: position % window_width};
    ret.can_go_left = position % window_width > 0;
    ret.can_go_up = position - window_width > -1
    ret.can_go_right = position % window_width < window_width - 1;
    ret.can_go_down = position + window_width < tiles.length; 
    ret.window_width = window_width;
    ret.tile_count = tiles.length;
    ret.min_potential = Number.MAX_VALUE;
    ret.max_potential = Number.MIN_VALUE;
    
    const setSurrounding = (position: number) => {
        if (tiles[position]?.score_potential < ret.min_potential) {
            ret.min_potential = tiles[position].score_potential;
        }

        if (tiles[position]?.score_potential > ret.max_potential) {
            ret.max_potential = tiles[position].score_potential;
        }

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
