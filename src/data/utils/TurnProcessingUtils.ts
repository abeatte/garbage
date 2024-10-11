import CombatantModel, { DecisionType, State, getMapTileEffect } from "../../models/CombatantModel";
import { DEFAULT, GlobalCombatantStatsModel, getStrengthRating } from "../../models/GlobalCombatantStatsModel";
import { TileModel, Type as TileType } from "../../models/TileModel";
import { Combatants, Items, Tiles } from "../slices/boardSlice";
import { GetCombatant } from "./CombatantUtils";
import { viewSurroundings } from "./SightUtils";
import Combatant from "../../objects/combatants/Combatant";
import Player from "../../objects/combatants/Player";
import { GetItem } from "./ItemUtils";
import { ItemModel } from "../../objects/items/Item";
import { MovementLogic } from "./GameUtils";

export function processBoardTick(
    { player, combatants, items, tiles, movement_logic, use_genders, global_combatant_stats }:
        { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: Tiles, movement_logic: MovementLogic, use_genders: boolean, global_combatant_stats: GlobalCombatantStatsModel }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: Tiles, global_combatant_stats: GlobalCombatantStatsModel } {
    if (player && player.state !== State.Dead) {
        combatants.c[player.position] = player;
    }

    // process combatants (including player) 
    const combatant_result = processCombatantTick({ combatants, tiles, movement_logic, use_genders, global_combatant_stats });
    global_combatant_stats.births += combatant_result.births;
    global_combatant_stats.deaths += combatant_result.deaths;

    // process items and tile effects
    const item_result = processEnvironmentEffects({ combatants: combatant_result.combatants, items, tiles, movement_logic, global_combatant_stats });

    // This step is crucial as without copying the Redux store will 
    // duplicate the now undefined combatants 
    const ret_combatants = { size: 0, c: {} } as Combatants;
    for (const c in item_result.combatants.c) {
        const combatant = item_result.combatants.c[c];
        ret_combatants.c[combatant.position] = combatant;
        ret_combatants.size++;
    }
    item_result.combatants = ret_combatants;

    return item_result;
}

export function isValidCombatantPosition(position: number | undefined, tiles: Readonly<Tiles>): boolean {
    return position !== undefined &&
        tiles.start <= position && position <= tiles.end &&
        isTileValidCombatantPosition(tiles.t[position]);
}

export function isTileValidCombatantPosition(tile: TileModel | undefined, ignore_void?: boolean): boolean {
    return tile !== undefined && (ignore_void || tile.type !== TileType.Void);
}

function processEnvironmentEffects(
    { combatants, items, tiles, movement_logic, global_combatant_stats }:
        { combatants: Combatants, items: Items, tiles: Tiles, movement_logic: MovementLogic, global_combatant_stats: Readonly<GlobalCombatantStatsModel> }
): { player: CombatantModel | undefined, combatants: Combatants, items: Items, tiles: Tiles, global_combatant_stats: GlobalCombatantStatsModel } {
    const working_global_combatant_stats = { ...DEFAULT, births: global_combatant_stats.births, deaths: global_combatant_stats.deaths };
    const working_combatants: Combatants = { size: 0, c: {} };
    const working_items: Items = { size: 0, i: {} };
    let deaths = 0;
    let player: CombatantModel | undefined;

    for (const p in items.i) {
        const position = parseInt(p);
        const position_items = items.i[position];

        position_items.forEach((i: ItemModel) => {
            const item = GetItem(i);
            if (item === undefined || item.isSpent()) {
                return;
            }

            const sight = viewSurroundings({ position: item.getPosition(), tiles, combatants });
            item.tap(sight, working_items, combatants, tiles);
        });
    }

    let live_combatant_count = 0;
    for (const p in combatants.c) {
        const position = parseInt(p);
        const combatant = GetCombatant(combatants.c[position]);

        if (!combatant.isImmortal()) {
            combatant.affectFitness(getMapTileEffect({ species: combatant.getSpecies(), tileType: tiles.t[position]?.type }));
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
            continue;
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
            working_combatants.c[position] = combatant.toModel();
            working_combatants.size++;
        }
    };

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
    { combatants, movement_logic, tiles, use_genders, global_combatant_stats }:
        {
            combatants: Combatants,
            movement_logic: MovementLogic,
            tiles: Tiles,
            use_genders: boolean,
            global_combatant_stats: Readonly<GlobalCombatantStatsModel>
        }
): { player: Player | undefined, combatants: Combatants, births: number, deaths: number } {
    const working_combatants: Combatants = { size: 0, c: {} };
    const mating_combatants: { [position: number]: Combatant } = {};
    let player;
    let births = 0, deaths = 0;

    // advance all combatants
    for (const p in combatants.c) {
        const current_position = parseInt(p);
        let combatant = GetCombatant(combatants.c[current_position]);

        if (combatant.isDead()) {
            continue;
        }

        // process movement;
        const { combatant: newCombatant, deaths: newDeaths } = processCombatantMovement({
            use_genders,
            combatant,
            combatants,
            global_combatant_stats,
            tiles,
            movement_logic,
        });
        combatant = newCombatant;

        deaths += newDeaths;

        if (combatant.isPlayer()) {
            player = combatant;
        }

        if (!combatant.isDead()) {
            working_combatants.c[combatant.getPosition()] = combatant.toModel();
            working_combatants.size++;
        }

        // capture mating combatants
        if (combatant.isMating()) {
            mating_combatants[combatant.getPosition()] = combatant;
        }
    };

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
            combatants: working_combatants,
        });

        if (spawn !== undefined && spawn.getPosition() > -1) {
            working_combatants.c[spawn.getPosition()] = spawn.toModel();
            working_combatants.size++;
            births++
        }
    });

    return { player, combatants: working_combatants, births, deaths };
}

function processCombatantMovement(
    { combatant, use_genders, combatants, global_combatant_stats, tiles, movement_logic }:
        {
            use_genders: boolean,
            combatant: Combatant,
            combatants: Readonly<{ [position: number]: Combatant }>,
            global_combatant_stats: GlobalCombatantStatsModel,
            tiles: Tiles,
            movement_logic: MovementLogic,
        }
): { combatant: Combatant, deaths: number } {
    let deaths = 0;

    if (combatant.isMating()) {
        // do nothing; their turn is taken up by mating
        return { combatant, deaths };
    }

    const sight = viewSurroundings(
        {
            can_create: combatant.isPlayer(),
            species: combatant.getSpecies(),
            position: combatant.getPosition(),
            tiles,
            combatants,
        }
    );
    const new_position = combatant.requestMove(
        {
            sight,
            movement_logic,
            tiles,
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

    if (combatant.isPlayer()) {
        viewSurroundings(
            {
                can_create: combatant.isPlayer(),
                species: combatant.getSpecies(),
                position: combatant.getPosition(),
                tiles,
                combatants,
            }
        );
    }

    return { combatant, deaths };
}
