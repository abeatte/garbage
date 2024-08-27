import CombatantModel, { DecisionType, State, createCombatant, getMapTileEffect, getNewPositionFromClockFace, getRandomDecisionType, getRandomSpecies, requestMove } from "../../models/CombatantModel";
import { DEFAULT, GlobalCombatantStatsModel, getStrengthRating } from "../../models/GlobalCombatantStatsModel";
import { TileModel } from "../../models/TileModel";
import { Combatants, Items, MovementLogic } from "../slices/boardSlice";
import { DirectionalMoves, MAX_YOUNGLING_TICK, MIN_HEALTH, PosData, addItemToBoard, compete, getSurroundings } from "./CombatantUtils";
import { ItemModel, Type as ItemType, State as ItemState } from "../../models/ItemModel";
import { SpiderModel, paintTileForSpider } from "../../models/SpiderModel";

export function processBoardTick(
    { player, combatants, items, window_width, tiles, movement_logic, use_genders, global_combatant_stats }:
        { player: CombatantModel | undefined, combatants: Combatants, items: Items, window_width: number, tiles: TileModel[], movement_logic: MovementLogic, use_genders: boolean, global_combatant_stats: GlobalCombatantStatsModel }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: TileModel[], global_combatant_stats: GlobalCombatantStatsModel } {
    if (player && player.state !== State.Dead) {
        combatants[player.position] = player;
    }

    // process combatants (including player) 
    const combatant_result = processCombatantTick({ combatants, tiles, window_width, movement_logic, use_genders, global_combatant_stats });
    global_combatant_stats.births += combatant_result.births;
    global_combatant_stats.deaths += combatant_result.deaths;

    // process items and tile effects
    const item_result = processEnvironmentEffects({ combatants: combatant_result.combatants, items, window_width, tiles, movement_logic, global_combatant_stats });

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined combatants 
    const ret_combatants = {} as Combatants;
    Object.values(item_result.combatants).forEach(c => {
        ret_combatants[c.position] = c;
    })
    item_result.combatants = ret_combatants;

    return item_result;
}

function processEnvironmentEffects(
    { combatants, items, tiles, window_width, movement_logic, global_combatant_stats }:
        { combatants: Combatants, items: Items, tiles: TileModel[], window_width: number, movement_logic: MovementLogic, global_combatant_stats: Readonly<GlobalCombatantStatsModel> }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: TileModel[], global_combatant_stats: GlobalCombatantStatsModel } {
    const working_global_combatant_stats = { ...DEFAULT, births: global_combatant_stats.births, deaths: global_combatant_stats.deaths } as GlobalCombatantStatsModel;
    const working_combatants: Combatants = {};
    const working_items: Items = [];
    let deaths = 0;
    let player;

    Object.keys(items).forEach(p => {
        const position = parseInt(p);
        const position_items = items[position];

        position_items.forEach((item: ItemModel) => {
            if (item.state === ItemState.Spent) {
                return;
            }

            switch (item.type) {
                case ItemType.Bomb:
                    if (item.fuse_length > 0 && item.tick === item.fuse_length) {
                        // time to blow
                        const posData = getSurroundings({ position: item.position, tiles, window_width, combatants });
                        posData.surroundings.forEach(surrounding => {
                            if (surrounding === undefined) {
                                return;
                            }

                            const c_to_die = surrounding.occupant;
                            if (c_to_die !== undefined) {
                                c_to_die.state = State.Dead;
                                deaths++;
                                item.kills += 1;
                            }
                            items[surrounding.position] = [];
                        });
                        // items[position] = [];
                        item.state = ItemState.Spent;
                    }
                    addItemToBoard(item, working_items);
                    break;
                case ItemType.PokemonBall:
                    const posData = getSurroundings({ position: item.position, tiles, window_width, combatants });
                    const valid_surroundings = posData.surroundings.filter(sur => sur !== undefined);
                    const capacity = valid_surroundings.length;

                    if (item.fuse_length > 0 && item.tick === item.fuse_length) {
                        // time to blow
                        const captives = item.captured;
                        item.captured = [];
                        while (captives.length > 0) {
                            const captive = captives.pop();
                            const surrounding = valid_surroundings.pop();
                            if (captive === undefined || surrounding === undefined) {
                                return;
                            }

                            // time passes for the captive
                            captive.tick += item.fuse_length;
                            captive.state = State.Alive;

                            const occupant = surrounding.occupant;

                            if (occupant === undefined) {
                                combatants[surrounding.position] = captive
                                captive.position = surrounding.position;
                                captive.visited_positions[surrounding.position] = surrounding.position;
                            } else {
                                combatants[surrounding.position] = compete(occupant, captive);
                                combatants[surrounding.position].position = surrounding.position;
                                combatants[surrounding.position].visited_positions[surrounding.position] = surrounding.position;
                                deaths++;
                            }
                        }
                        // item.state = ItemState.Spent;
                    } else {
                        if (item.captured.length < capacity) {
                            // can only store as many tiles as it can disgorge into
                            posData.surroundings.forEach(surrounding => {
                                const c_to_capture = surrounding?.occupant;
                                if (c_to_capture) {
                                    item.captured.push(c_to_capture);
                                    combatants[c_to_capture.position].state = State.Captured;
                                    c_to_capture.position = -1;
                                }
                            });
                        }
                        addItemToBoard(item, working_items);
                    }
                    break;
                case ItemType.MedPack:
                    const occupant = combatants[position];
                    if (occupant) {
                        occupant.fitness += -MIN_HEALTH;
                    } else {
                        addItemToBoard(item, working_items);
                    }
                    break;
                case ItemType.Spider:
                    const clockFace = DirectionalMoves[Math.floor(Math.random() * Object.values(DirectionalMoves).length)];
                    const new_position = getNewPositionFromClockFace(
                        item.position,
                        clockFace,
                        window_width,
                        tiles.length,
                    );
                    if (item.fuse_length > 0 && item.tick < item.fuse_length) {
                        item.position = new_position;
                        addItemToBoard(item, working_items);
                        paintTileForSpider(item as SpiderModel, tiles, window_width);
                    }
                    break;
            }
            item.tick += 1;
        });
    })

    let live_combatant_count = 0;
    Object.keys(combatants).forEach(p => {
        const position = parseInt(p);
        const combatant = combatants[position];

        if (!combatant.immortal) {
            combatant.fitness += getMapTileEffect({ species: combatant.species, tileType: tiles[position].type });
        }
        combatant.strength = getStrengthRating({ global_combatant_stats, fitness: combatant.fitness, immortal: combatant.immortal });


        if (combatant.fitness < MIN_HEALTH) {
            // you die
            combatant.state = State.Dead;
            deaths++;
        }

        // catch the player
        if (combatant.is_player) {
            player = combatant;
        }

        if (combatant.state === State.Dead || combatant.state === State.Captured) {
            return;
        }

        working_global_combatant_stats.average_position += position;
        if (working_global_combatant_stats.min_fitness > combatant.fitness) {
            working_global_combatant_stats.min_fitness = combatant.fitness;
        }
        working_global_combatant_stats.average_fitness += combatant.fitness;
        if (working_global_combatant_stats.max_fitness < combatant.fitness) {
            working_global_combatant_stats.max_fitness = combatant.fitness;
        }

        live_combatant_count++;
        combatant.tick += 1;

        // strip out the player
        if (!combatant.is_player) {
            working_combatants[position] = combatant;
        }
    });

    working_global_combatant_stats.deaths += deaths;

    working_global_combatant_stats.num_combatants =
        live_combatant_count;
    working_global_combatant_stats.average_position =
        working_global_combatant_stats.average_position / live_combatant_count;
    working_global_combatant_stats.average_fitness =
        working_global_combatant_stats.average_fitness / live_combatant_count;
    working_global_combatant_stats.weak_bar =
        (working_global_combatant_stats.average_fitness + working_global_combatant_stats.min_fitness) / 2;
    working_global_combatant_stats.average_bar =
        (working_global_combatant_stats.average_fitness + working_global_combatant_stats.max_fitness) / 2;

    return { player, combatants: working_combatants, items: working_items, tiles, global_combatant_stats: working_global_combatant_stats };
}

function processCombatantTick(
    { combatants, movement_logic, tiles, window_width, use_genders, global_combatant_stats }:
        {
            combatants: Combatants,
            movement_logic: MovementLogic,
            tiles: TileModel[],
            window_width: number,
            use_genders: boolean,
            global_combatant_stats: Readonly<GlobalCombatantStatsModel>
        }
): { player: CombatantModel | undefined, combatants: Readonly<Combatants>, births: number, deaths: number } {
    const working_combatants: Combatants = {};
    const mating_combatants: Combatants = {};
    let player;
    let births = 0, deaths = 0;

    // advance all combatants
    Object.keys(combatants).forEach((p) => {
        const current_position = parseInt(p);

        if (combatants[current_position].state === State.Dead) {
            return;
        }

        // process movement;
        const { combatant, deaths: newDeaths } = processCombatantMovement({
            use_genders,
            combatant: combatants[current_position],
            combatants,
            global_combatant_stats,
            tiles,
            window_width,
            movement_logic,
        });

        deaths += newDeaths;

        if (combatant.is_player) {
            player = combatant;
        }

        if (combatant.state !== State.Dead) {
            working_combatants[combatant.position] = combatant;
        }

        // capture mating combatants
        if (combatant.state === State.Mating) {
            mating_combatants[combatant.position] = combatant;
        }
    });

    // process mating
    Object.values(mating_combatants).forEach(c => {
        const parent = c;
        const spawn = parent.spawn;
        parent.state = State.Alive;
        if (spawn === undefined) {
            // congrats, dad... get lost
            parent.children += 1;
            return;
        }

        parent.spawn = undefined;
        birthSpawn({
            posData:
                getSurroundings({
                    species: spawn.species,
                    position: parent.position,
                    tiles,
                    window_width,
                    combatants: working_combatants,
                }),
            spawn,
            parent,
            arena_size: tiles.length
        });

        if (spawn.position > -1) {
            working_combatants[spawn.position] = spawn;
            spawn.state = State.Alive;
            parent.children += 1;
            births++
        }
    });

    // process all entities (items)

    // update stats

    return { player, combatants: working_combatants, births, deaths };
}


function birthSpawn({ posData, spawn, parent, arena_size }:
    { posData: PosData, spawn: CombatantModel, parent: CombatantModel, arena_size: number }) {
    const { surroundings } = posData;
    const friendly_positions = [],
        enemy_positions = [],
        empty_positions = [] as number[];

    surroundings.forEach((surrounding, idx, s_arr) => {
        if (!surrounding) {
            return;
        }

        const { position, occupant: c } = surrounding;

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
            empty_positions[Math.round(Math.random() * (empty_positions.length - 1))] :
            -1;
        if (spawn_pos > -1) {
            spawn.position = spawn_pos;
            spawn.visited_positions[spawn_pos] = spawn_pos;
            // too many of my kind here, let's diverge
            spawn.species = friendly_positions.length < 4 ? parent.species : getRandomSpecies();
            // 1:4 chance of a different decision_type from the parent
            spawn.decision_type = Math.random() > 0.25 ? parent.decision_type : getRandomDecisionType();
        }
    }
}

function processCombatantMovement(
    { combatant, use_genders, combatants, global_combatant_stats, tiles, window_width, movement_logic }:
        {
            use_genders: boolean,
            combatant: CombatantModel,
            combatants: Readonly<{ [position: number]: CombatantModel }>,
            global_combatant_stats: GlobalCombatantStatsModel,
            tiles: TileModel[],
            window_width: number,
            movement_logic: MovementLogic,
        }
): { combatant: CombatantModel, deaths: number } {
    let deaths = 0;

    const current_position = combatant.position;

    if (combatant.state === State.Mating) {
        // do nothing; their turn is taken up by mating
        return { combatant, deaths };
    }

    let new_position;
    if (combatant.is_player) {
        if (combatant.target_destination > -1) {
            new_position = combatant.target_destination;
        } else {
            new_position = current_position;
        }
        combatant.target_destination = -1;
    } else {
        const posData = getSurroundings(
            {
                species: combatant.species,
                position: current_position,
                tiles,
                window_width,
                combatants,
            }
        );
        new_position = requestMove(
            {
                posData,
                movement_logic,
                self: combatant,
                tiles,
                window_width,
            });

        // this fixes a type error below
        /* eslint-disable-next-line no-self-assign */
        combatant = combatant;
    }

    const occupant = combatants[new_position];
    if (!occupant) {
        // space is empty; OK to move
        combatant.position = new_position;
        combatant.visited_positions[new_position] = new_position;
    } else if (combatant.id === occupant.id) {
        // this combatant has decided not to move anywhere
        // no-op
    } else if (
        occupant.species === combatant.species &&
        // if a Fighter is here they're not necessarily here to mate!
        (combatant.decision_type !== DecisionType.Fighter || combatant.state === State.Mating)
    ) {
        // space is occupied by a friendly
        if (
            // your not too young
            combatant.tick > MAX_YOUNGLING_TICK &&
            // they're not too young
            occupant.tick > MAX_YOUNGLING_TICK &&
            (
                !use_genders ||
                combatant.gender !== occupant.gender
            )
        ) {
            occupant.state = State.Mating;
            combatant.state = State.Mating;
            combatant.spawn = createCombatant({
                species: occupant.species,
                decision_type: Math.random() < .5 ? occupant.decision_type : combatant.decision_type,
                spawn_position: -1,
                global_combatant_stats
            });
        }
    } else {
        // space is occupied by a enemy (or an ally but with a Fighter incumbent)
        combatant = compete(combatant, occupant);
        combatant.position = new_position;
        combatant.visited_positions[new_position] = new_position;
        deaths++;
    }

    return { combatant, deaths };
}
