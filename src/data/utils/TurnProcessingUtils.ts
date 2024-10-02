import CombatantModel, { DecisionType, State, getMapTileEffect } from "../../models/CombatantModel";
import { DEFAULT, GlobalCombatantStatsModel, getStrengthRating } from "../../models/GlobalCombatantStatsModel";
import { TileModel, Type as TileType } from "../../models/TileModel";
import { Combatants, Items, MovementLogic } from "../slices/boardSlice";
import { GetCombatantObject } from "./CombatantUtils";
import { viewSurroundings } from "./SightUtils";
import CombatantObject from "../../objects/combatants/CombatantObject";
import PlayerObject from "../../objects/combatants/PlayerObject";
import { GetItemObject } from "./ItemUtils";
import { ItemModel } from "../../objects/items/Item";

export function processBoardTick(
    { player, combatants, items, window_width, tiles, movement_logic, use_genders, global_combatant_stats }:
        { player: CombatantModel | undefined, combatants: Combatants, items: Items, window_width: number, tiles: TileModel[], movement_logic: MovementLogic, use_genders: boolean, global_combatant_stats: GlobalCombatantStatsModel }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: TileModel[], global_combatant_stats: GlobalCombatantStatsModel } {
    if (player && player.state !== State.Dead) {
        combatants[player.position] = player;
    }

    // TODO: this is a hack
    const combatantObjects = {} as { [position: number]: CombatantObject };
    Object.keys(combatants).forEach(k => {
        combatantObjects[k as unknown as number] = GetCombatantObject(combatants[k as unknown as number]);
    });

    // process combatants (including player) 
    const combatant_result = processCombatantTick({ combatants: combatantObjects, tiles, window_width, movement_logic, use_genders, global_combatant_stats });
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

export function isValidCombatantPosition(position: number | undefined, tiles: Readonly<TileModel[]>): boolean {
    return position !== undefined &&
        0 <= position && position < tiles.length &&
        isTileValidCombatantPosition(tiles[position]);
}

export function isTileValidCombatantPosition(tile: TileModel | undefined): boolean {
    return tile !== undefined && tile.type !== TileType.Void;
}

function processEnvironmentEffects(
    { combatants, items, tiles, window_width, movement_logic, global_combatant_stats }:
        { combatants: { [position: number]: CombatantObject }, items: Items, tiles: TileModel[], window_width: number, movement_logic: MovementLogic, global_combatant_stats: Readonly<GlobalCombatantStatsModel> }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: TileModel[], global_combatant_stats: GlobalCombatantStatsModel } {
    const working_global_combatant_stats = { ...DEFAULT, births: global_combatant_stats.births, deaths: global_combatant_stats.deaths } as GlobalCombatantStatsModel;
    const working_combatants: Combatants = {};
    const working_items: Items = [];
    let deaths = 0;
    let player: CombatantModel | undefined;

    Object.keys(items).forEach(p => {
        const position = parseInt(p);
        const position_items = items[position];

        position_items.forEach((i: ItemModel) => {
            const item = GetItemObject(i);
            if (item === undefined || item.isSpent()) {
                return;
            }

            const sight = viewSurroundings({ position: item.getPosition(), tiles, window_width, combatants });
            item.tap(sight, working_items, combatants, tiles, window_width);
        });
    })

    let live_combatant_count = 0;
    Object.keys(combatants).forEach(p => {
        const position = parseInt(p);
        const combatant = combatants[position];

        if (!combatant.isImmortal()) {
            combatant.affectFitness(getMapTileEffect({ species: combatant.getSpecies(), tileType: tiles[position].type }));
        }
        combatant.updateStrengthRating(getStrengthRating({ global_combatant_stats, fitness: combatant.getFitness(), immortal: combatant.isImmortal() }));

        // catch the player
        if (combatant.isPlayer()) {
            player = combatant.toModel();
        }

        if (combatant.isDead()) {
            deaths++;
        }

        if (combatant.isDead() || combatant.isCaptured()) {
            return;
        }

        working_global_combatant_stats.average_position += position;
        if (working_global_combatant_stats.min_fitness > combatant.getFitness()) {
            working_global_combatant_stats.min_fitness = combatant.getFitness();
        }
        working_global_combatant_stats.average_fitness += combatant.getFitness();
        if (working_global_combatant_stats.max_fitness < combatant.getFitness()) {
            working_global_combatant_stats.max_fitness = combatant.getFitness();
        }

        live_combatant_count++;
        combatant.tick();

        // strip out the player
        if (!combatant.isPlayer()) {
            working_combatants[position] = combatant.toModel();
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
            combatants: { [position: number]: CombatantObject },
            movement_logic: MovementLogic,
            tiles: TileModel[],
            window_width: number,
            use_genders: boolean,
            global_combatant_stats: Readonly<GlobalCombatantStatsModel>
        }
): { player: PlayerObject | undefined, combatants: Readonly<{ [position: number]: CombatantObject }>, births: number, deaths: number } {
    const working_combatants: { [position: number]: CombatantObject } = {};
    const mating_combatants: { [position: number]: CombatantObject } = {};
    let player;
    let births = 0, deaths = 0;

    // advance all combatants
    Object.keys(combatants).forEach((p) => {
        const current_position = parseInt(p);

        if (combatants[current_position].isDead()) {
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

        if (combatant.isPlayer()) {
            player = combatant;
        }

        if (!combatant.isDead()) {
            working_combatants[combatant.getPosition()] = combatant;
        }

        // capture mating combatants
        if (combatant.isMating()) {
            mating_combatants[combatant.getPosition()] = combatant;
        }
    });

    // process mating
    Object.values(mating_combatants).forEach(c => {
        const parent = c;
        if (!parent.isPregnant()) {
            // congrats, dad... get lost
            parent.fatherSpawn();
            return;
        }

        const spawn = parent.birthSpawn({
            tiles,
            window_width,
            arena_size: tiles.length,
            combatants: working_combatants,
        });

        if (spawn !== undefined && spawn.getPosition() > -1) {
            working_combatants[spawn.getPosition()] = spawn;
            births++
        }
    });

    return { player, combatants: working_combatants, births, deaths };
}

function processCombatantMovement(
    { combatant, use_genders, combatants, global_combatant_stats, tiles, window_width, movement_logic }:
        {
            use_genders: boolean,
            combatant: CombatantObject,
            combatants: Readonly<{ [position: number]: CombatantObject }>,
            global_combatant_stats: GlobalCombatantStatsModel,
            tiles: TileModel[],
            window_width: number,
            movement_logic: MovementLogic,
        }
): { combatant: CombatantObject, deaths: number } {
    let deaths = 0;

    if (combatant.isMating()) {
        // do nothing; their turn is taken up by mating
        return { combatant, deaths };
    }

    const sight = viewSurroundings(
        {
            species: combatant.getSpecies(),
            position: combatant.getPosition(),
            tiles,
            window_width,
            combatants,
        }
    );
    const new_position = combatant.requestMove(
        {
            sight,
            movement_logic,
            tiles,
            window_width,
        });

    const occupant = combatants[new_position];
    if (!occupant) {
        // space is empty; OK to move
        combatant.setPosition(new_position);
    } else if (combatant.getID() === occupant.getID()) {
        // this combatant has decided not to move anywhere
        // no-op
    } else if (
        occupant.getSpecies() === combatant.getSpecies() &&
        // if a Fighter is here they're not necessarily here to mate!
        (combatant.getDecisionType() !== DecisionType.Fighter || combatant.getState() === State.Mating)
    ) {
        // space is occupied by a friendly
        if (combatant.canMateWith(occupant, use_genders)) {
            combatant.mateWith(sight, occupant, global_combatant_stats);
        }
    } else {
        // space is occupied by a enemy (or an ally but with a Fighter incumbent)
        combatant = combatant.fightWith(occupant);
        combatant.setPosition(new_position);
        deaths++;
    }

    return { combatant, deaths };
}
