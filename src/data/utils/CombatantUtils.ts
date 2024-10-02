import { Combatants } from "../slices/boardSlice";
import { TileModel } from "../../models/TileModel";
import { ItemModel, MAX_TILE_ITEM_COUNT } from "../../models/ItemModel";
import { viewSurroundings } from "./SightUtils";
import { isValidCombatantPosition } from "./TurnProcessingUtils";
import CombatantObject from "../../objects/CombatantObject";
import PlayerObject from "../../objects/PlayerObject";
import CombatantModel, { Character, DecisionType } from "../../models/CombatantModel";
import { GlobalCombatantStatsModel } from "../../models/GlobalCombatantStatsModel";
import NPC from "../../objects/NPC";
import SeekerObject from "../../objects/SeekerObject";

export const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export enum ClockFace {
    c = 0,
    tl = 1, t = 2, tr = 3,
    r = 4,
    br = 5, b = 6, bl = 7,
    l = 8,
};

export const DirectionalMoves = [ClockFace.t, ClockFace.r, ClockFace.b, ClockFace.l];
export const DiagonalMoves = [ClockFace.tl, ClockFace.tr, ClockFace.br, ClockFace.bl];
export const LegalMoves = [ClockFace.c, ...DirectionalMoves];
export const IllegalMoves = [...DiagonalMoves];


export function GetCombatantObject(model: { position: number, species?: Character, decision_type?: DecisionType }, global_combatant_stats?: GlobalCombatantStatsModel): CombatantObject;
export function GetCombatantObject(model: CombatantModel | undefined): CombatantObject | undefined;
export function GetCombatantObject(
    model?: {
        position: number, species?: Character, decision_type?: DecisionType, is_player?: boolean
    } | CombatantModel,
    global_combatant_stats?: GlobalCombatantStatsModel
): CombatantObject | undefined {
    if (model === undefined) {
        return undefined;
    } else if (PlayerObject.IsOf(model)) {
        return new PlayerObject(model, global_combatant_stats);
    } else if (SeekerObject.IsOf(model)) {
        return new SeekerObject(model, global_combatant_stats);
    } else if (NPC.IsOf(model)) {
        return new NPC(model, global_combatant_stats);
    }

    throw new Error("Method not implemented.")
}

export function initCombatantStartingPos(
    args: { tiles: TileModel[], player: PlayerObject | undefined, combatants: Combatants }
): number {
    let starting_pos = -1;
    // you have 10 tries to find a valid spot otherwise you don't get to exist
    for (let i = 0; i < 10 && starting_pos === -1; i++) {
        const potential_pos = Math.round(Math.random() * (args.tiles.length - 1));
        if (
            !args.combatants[potential_pos] &&
            args.player?.getPosition() !== potential_pos &&
            isValidCombatantPosition(potential_pos, args.tiles)
        ) {
            starting_pos = potential_pos;
        }
    }

    return starting_pos;
};

export function updateCombatantsPositionsAfterResize(
    { combatants, window_width, window_height, old_window_width, old_window_height, tiles }:
        {
            combatants: Combatants,
            window_width: number,
            window_height: number,
            old_window_width: number,
            old_window_height: number,
            tiles: TileModel[]
        }
): { combatants: Combatants, deaths: number } {
    const new_combatants = {} as Combatants;
    let deaths = 0;

    const dif_row = window_width - old_window_width;
    const dif_col = window_height - old_window_height;
    Object.keys(combatants).forEach(k => {
        const old_pos = k as unknown as number;
        let new_pos = k as unknown as number;
        let coord = [Math.floor(old_pos / old_window_width), old_pos % old_window_width];

        if (coord[1] >= window_width || coord[0] >= window_height) {
            // they fell off the world; let's try to move them up/left
            const sight =
                viewSurroundings({ species: combatants[old_pos].species, position: old_pos, tiles, window_width: old_window_width, combatants });
            const up_position = sight.surroundings[ClockFace.t];
            const up_left_position = sight.surroundings[ClockFace.tl];
            const left_position = sight.surroundings[ClockFace.l];

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
            const occupient = GetCombatantObject(new_combatants[new_pos]);
            new_combatants[new_pos] = occupient ? occupient.fightWith(GetCombatantObject(combatants[old_pos])).toModel() : combatants[old_pos];
            new_combatants[new_pos].position = new_pos;
            new_combatants[new_pos].visited_positions[new_pos] = new_pos;
            if (occupient) {
                deaths++;
            }
        } else {
            deaths++;
        }
    })
    return { combatants: new_combatants, deaths };
}

/**
 * Handles the removing of Combatants from the Combatants object without creating undefined spaces. 
 * @returns a copy of the Combatants without the killed positions (and no undefined spaces)
 */
export function killAndCopy({ positions, combatants }: { positions: number[], combatants: Combatants }): Combatants {
    return Object.values(combatants).reduce((ret_combatants, combatant, _idx, _working_combatants) => {
        if (!positions.includes(combatant.position)) {
            ret_combatants[combatant.position] = combatant;
        }
        return ret_combatants;
    }, {} as Combatants);
}

export function addItemToBoard(item: ItemModel, working_items: { [position: number]: ItemModel[] | undefined }) {
    if (working_items[item.position] === undefined) {
        working_items[item.position] = [];
    }

    const items = working_items[item.position] as ItemModel[];
    if (items.length === MAX_TILE_ITEM_COUNT) {
        items.shift();
    }
    items.push(item);
}
