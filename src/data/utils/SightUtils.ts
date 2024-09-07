import CombatantModel, { Character } from "../../models/CombatantModel";
import { getMapTileScorePotentials, TileModel } from "../../models/TileModel";
import { ClockFace, LegalMoves } from "./CombatantUtils";

export interface Surroundings {
    position: number,
    occupant: CombatantModel | undefined,
    tile: TileModel,
}

export interface Sight {
    min_potential: number,
    max_potential: number,
    center: Surroundings
    surroundings: (Surroundings | undefined)[],
    getNewRandomPosition: () => number,
}

export function viewSurroundings(
    { species, position, tiles, window_width, combatants }:
        {
            species?: Character | undefined,
            position: number,
            tiles: TileModel[],
            window_width: number,
            // the Player should already be in the combatants array at this point in evaluation
            combatants: { [position: number]: CombatantModel | undefined }
        }
): Sight {
    let min_potential = Number.MAX_VALUE;
    let max_potential = Number.MIN_VALUE;

    const setSurrounding = (position: number) => {
        const score_potential =
            !species ? -1 :
                getMapTileScorePotentials({ position, tiles, window_width })[species];

        if (score_potential < min_potential) {
            min_potential = score_potential;
        }

        if (score_potential > max_potential) {
            max_potential = score_potential;
        }

        return {
            position,
            occupant: combatants[position],
            tile: tiles[position]
        }
    }

    const can_go_left = position % window_width > 0;
    const can_go_up = position - window_width > -1
    const can_go_right = position % window_width < window_width - 1;
    const can_go_down = position + window_width < tiles.length;

    // start at center position and then move clockwise around
    const surroundings = Array(9);
    const center = setSurrounding(position);
    surroundings[ClockFace.c] = center;
    surroundings[ClockFace.tl] = can_go_up && can_go_left ?
        setSurrounding(position - window_width - 1) : undefined;
    surroundings[ClockFace.t] = can_go_up ?
        setSurrounding(position - window_width) : undefined;
    surroundings[ClockFace.tr] = can_go_up && can_go_right ?
        setSurrounding(position - window_width + 1) : undefined;
    surroundings[ClockFace.r] = can_go_right ?
        setSurrounding(position + 1) : undefined;
    surroundings[ClockFace.br] = can_go_down && can_go_right ?
        setSurrounding(position + window_width + 1) : undefined;
    surroundings[ClockFace.b] = can_go_down ?
        setSurrounding(position + window_width) : undefined;
    surroundings[ClockFace.bl] = can_go_down && can_go_left ?
        setSurrounding(position + window_width - 1) : undefined;
    surroundings[ClockFace.l] = can_go_left ?
        setSurrounding(position - 1) : undefined;

    const getNewRandomPosition = () => {
        return surroundings[LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)]]?.position ?? center.position;
    }

    return { surroundings, min_potential, max_potential, center, getNewRandomPosition };
};
