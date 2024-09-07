import { Combatants } from "../slices/boardSlice";
import CombatantModel, {
    Character,
    State
} from "../../models/CombatantModel";
import { getMapTileScorePotentials, TileModel } from "../../models/TileModel";
import { ItemModel, MAX_TILE_ITEM_COUNT } from "../../models/ItemModel";

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

export interface Surroundings {
    position: number,
    occupant: CombatantModel | undefined,
    tile: TileModel,
}

export interface Sight {
    coord: { x: number, y: number },
    min_potential: number,
    max_potential: number,
    center: Surroundings
    surroundings: (Surroundings | undefined)[],
    getNewRandomPosition: () => number,
}

export function initCombatantStartingPos(
    args: { tiles: TileModel[], player: CombatantModel | undefined, combatants: Combatants }
): number {
    let starting_pos = -1;
    // you have 10 tries to find a valid spot otherwise you don't get to exist
    for (let i = 0; i < 10 && starting_pos === -1; i++) {
        const potential_pos = Math.round(Math.random() * (args.tiles.length - 1));
        if (!args.combatants[potential_pos] && args.player?.position !== potential_pos) {
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
            const occupient = new_combatants[new_pos];
            new_combatants[new_pos] = !!occupient ? compete(occupient, combatants[old_pos]) : combatants[old_pos];
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

/**
 * Ties go to the a_combatant (the attacker)
 * @param {*} a the attacking combatant
 * @param {*} b the defending combatant
 * @returns the fitter combatant
 */
export function compete(a: CombatantModel, b: CombatantModel) {
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
    const coord = { y: Math.floor(position / window_width), x: position % window_width };
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

    return { coord, surroundings, min_potential, max_potential, center, getNewRandomPosition };
};
