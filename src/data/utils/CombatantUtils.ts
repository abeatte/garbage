import { Combatants, Items, Tiles } from "../slices/boardSlice";
import { isValidCombatantPosition } from "./TurnProcessingUtils";
import Combatant from "../../objects/combatants/Combatant";
import Player from "../../objects/combatants/Player";
import CombatantModel from "../../models/CombatantModel";
import { GlobalCombatantStatsModel } from "../../models/GlobalCombatantStatsModel";
import Seeker from "../../objects/combatants/Seeker";
import NPC from "../../objects/combatants/NPC";
import Item, { ItemModel, MAX_TILE_ITEM_COUNT } from "../../objects/items/Item";

export const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export enum Purpose { Map, Tile, Detail, Paint };

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

export function GetCombatant(model: Partial<CombatantModel>): Combatant;
export function GetCombatant(model: Partial<CombatantModel> | undefined): Combatant | undefined;
export function GetCombatant(model: Partial<CombatantModel>, global_combatant_stats?: GlobalCombatantStatsModel): Combatant;
export function GetCombatant(model?: Partial<CombatantModel>, global_combatant_stats?: GlobalCombatantStatsModel
): Combatant | undefined {
    if (model === undefined) {
        return undefined;
    } else if (Player.IsOf(model)) {
        return new Player(model, global_combatant_stats);
    } else if (Seeker.IsOf(model)) {
        return new Seeker(model, global_combatant_stats);
    } else if (NPC.IsOf(model)) {
        return new NPC(model, global_combatant_stats);
    }

    throw new Error("CombatantType not implemented.")
}

export function initCombatantStartingPos(
    args: { tiles: Tiles, player: Player | undefined, combatants: Combatants }
): number {
    let starting_pos = -1;
    // you have 10 tries to find a valid spot otherwise you don't get to exist
    for (let i = 0; i < 10 && starting_pos === -1; i++) {
        const potential_pos = Math.round(Math.random() * (args.tiles.size - 1)) + args.tiles.start;
        if (
            args.combatants.c[potential_pos] === undefined &&
            args.player?.getPosition() !== potential_pos &&
            isValidCombatantPosition(potential_pos, args.tiles)
        ) {
            starting_pos = potential_pos;
        }
    }

    return starting_pos;
};

export function updateCombatantsPositionsAfterResize(
    { combatants, old_window_width, tiles }:
        {
            combatants: Combatants,
            old_window_width: number,
            tiles: Tiles
        }
): { combatants: Combatants, deaths: number } {
    const new_combatants: Combatants = { size: 0, c: {} };
    let deaths = 0;

    const dif_row = tiles.width - old_window_width;
    for (const k in combatants.c) {
        const old_pos = parseInt(k);
        let new_pos = parseInt(k);
        let coord = [Math.floor((old_pos - tiles.start) / old_window_width), (old_pos - tiles.start) % old_window_width];

        if (coord[0] >= tiles.height) {
            coord[0]--;
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        } else if (coord[1] >= tiles.width) {
            coord[1]--;
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        } else if (dif_row !== 0) {
            // translate old coord to new coord
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        }

        if (isValidCombatantPosition(new_pos, tiles)) {
            const occupient = GetCombatant(new_combatants.c[new_pos]);
            new_combatants.c[new_pos] = occupient ? occupient.fightWith(GetCombatant(combatants.c[old_pos])).toModel() : combatants.c[old_pos];
            new_combatants.c[new_pos].position = new_pos;
            new_combatants.c[new_pos].visited_positions[new_pos] = new_pos;
            new_combatants.size++;
            if (occupient) {
                deaths++;
            }
        } else {
            deaths++;
        }
    }
    return { combatants: new_combatants, deaths };
}

/**
 * Handles the removing of Combatants from the Combatants object without creating undefined spaces. 
 * @returns a copy of the Combatants without the killed positions (and no undefined spaces)
 */
export function killAndCopy({ positions, combatants }: { positions: number[], combatants: Combatants }): Combatants {
    return Object.values(combatants.c).reduce((ret_combatants, combatant, _idx, _working_combatants) => {
        if (!positions.includes(combatant.position)) {
            ret_combatants.c[combatant.position] = combatant;
            ret_combatants.size++;
        }
        return ret_combatants;
    }, { size: 0, c: {} } as Combatants);
}

export function addItemToBoard(item: Item, working_items: Items) {
    if (working_items.i[item.getPosition()] === undefined) {
        working_items.i[item.getPosition()] = [];
    }

    const items: ItemModel[] = working_items.i[item.getPosition()];
    if (items.length === MAX_TILE_ITEM_COUNT) {
        items.shift();
    } else {
        working_items.size++;
    }
    items.push(item.toModel());
}
