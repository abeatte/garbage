import { Character } from "../../models/CombatantModel";
import { getMapTileScorePotentials, TileModel, Type as TileType } from "../../models/TileModel";
import Combatant from "../../objects/combatants/Combatant";
import { addTileToMap } from "../../objects/items/Spider";
import { Combatants, Tiles } from "../slices/boardSlice";
import { ClockFace, GetCombatant, LegalMoves } from "./CombatantUtils";
import { isTileValidCombatantPosition } from "./TurnProcessingUtils";

export interface Surrounding {
    position: number,
    occupant: Combatant | undefined,
    tile: TileModel | undefined,
}

export interface Sight {
    min_potential: number,
    max_potential: number,
    center: Surrounding | undefined,
    surroundings: (Surrounding | undefined)[],
    getNewRandomPosition: () => number,
}

export function viewSurroundings(
    { can_create, species, position, tiles, combatants, ignore_void_tiles }:
        {
            can_create?: boolean,
            species?: Character,
            position: number,
            tiles: Tiles,
            ignore_void_tiles?: boolean,
            // the Player should already be in the combatants array at this point in evaluation
            combatants?: Combatants,
        }
): Sight {
    let min_potential = Number.MAX_VALUE;
    let max_potential = Number.MIN_VALUE;

    const setSurrounding = (position: number) => {
        if (tiles.t[position] === undefined) {
            if (!can_create) {
                return;
            } else {
                const rand = Math.random();
                const tile_type =
                    rand < 0.1 ? TileType.Void :
                        rand < 0.2 ? TileType.Water :
                            rand < 0.3 ? TileType.Grass :
                                TileType.Rock;
                addTileToMap(position, tile_type, tiles)
            }
        }

        const score_potential = species === undefined ?
            -1 :
            getMapTileScorePotentials({ position, tiles })[species] ?? -1;

        if (score_potential < min_potential) {
            min_potential = score_potential;
        }

        if (score_potential > max_potential) {
            max_potential = score_potential;
        }

        return {
            position,
            occupant: GetCombatant(combatants?.c[position]),
            tile: tiles.t[position]
        }
    }

    const can_stay_put = position >= tiles.start && position <= tiles.end;
    const can_go_left = (position - tiles.start) % tiles.width > 0;
    let can_go_up = (position - tiles.start) - tiles.width > -1
    const can_go_right = (position - tiles.start) % tiles.width < tiles.width - 1;
    let can_go_down = position + tiles.width < tiles.end;


    if (can_create) {
        if (!can_go_up) {
            setSurrounding(position - tiles.width);
            tiles.height++;
            can_go_up = true;
        }
        if (!can_go_down) {
            setSurrounding(position + tiles.width);
            tiles.height++;
            can_go_down = true;
        }
    }

    // start at center position and then move clockwise around
    const surroundings: (Surrounding | undefined)[] = Array(9);
    const center = can_stay_put ? setSurrounding(position) : undefined;
    surroundings[ClockFace.c] = center;
    surroundings[ClockFace.tl] = can_go_up && can_go_left ?
        setSurrounding(position - tiles.width - 1) : undefined;
    surroundings[ClockFace.t] = can_go_up ?
        setSurrounding(position - tiles.width) : undefined;
    surroundings[ClockFace.tr] = can_go_up && can_go_right ?
        setSurrounding(position - tiles.width + 1) : undefined;
    surroundings[ClockFace.r] = can_stay_put && can_go_right ?
        setSurrounding(position + 1) : undefined;
    surroundings[ClockFace.br] = can_go_down && can_go_right ?
        setSurrounding(position + tiles.width + 1) : undefined;
    surroundings[ClockFace.b] = can_go_down ?
        setSurrounding(position + tiles.width) : undefined;
    surroundings[ClockFace.bl] = can_go_down && can_go_left ?
        setSurrounding(position + tiles.width - 1) : undefined;
    surroundings[ClockFace.l] = can_stay_put && can_go_left ?
        setSurrounding(position - 1) : undefined;

    const getNewRandomPosition = () => {
        const surrounding = surroundings[LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)]];
        if (isTileValidCombatantPosition(surrounding?.tile, ignore_void_tiles)) {
            return surrounding!.position;
        }
        return center?.position ?? -1;
    }

    return { surroundings, min_potential, max_potential, center, getNewRandomPosition };
}; 
