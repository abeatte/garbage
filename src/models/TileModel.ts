import { Tiles } from "../data/slices/boardSlice";
import { DirectionalMoves } from "../data/utils/CombatantUtils";
import { Character, getMapTileEffect } from "./CombatantModel";

export enum Type { Void = "Void", Water = "Water", Fire = "Fire", Rock = "Rock", Sand = "Sand", Grass = "Grass" };

export interface TileModel {
    index: number,
    type: Type,
    score_potential: { [species: string]: number },
}

export function createTileModel(args: { index: number, type: Type }): TileModel {
    return {
        index: args.index,
        type: args.type,
        score_potential: {},
    }
}

export function clearMapTileScorePotentials(args: { position: number, tiles: Tiles }): void {
    const { position, tiles } = args;

    let tile = tiles.t[position];
    // center
    if (tile) {
        tile.score_potential = {};
    }
    let bounds = (position - tiles.start) % tiles.width;
    tile = tiles.t[position - 1];
    // left
    if (bounds > 0 && tile) {
        tile.score_potential = {};
    }
    bounds = (position - tiles.start) - tiles.width;
    tile = tiles.t[position - tiles.width];
    // up
    if (bounds > -1 && tile) {
        tile.score_potential = {};
    }
    bounds = (position - tiles.start) % tiles.width;
    tile = tiles.t[position + 1];
    // right
    if (bounds < tiles.width - 1 && tile) {
        tile.score_potential = {};
    }
    bounds = position + tiles.width;
    tile = tiles.t[position + tiles.width];
    // down
    if (bounds <= tiles.end && tile) {
        tile.score_potential = {};
    }
}

/**
 * @returns the given tile's potential as a tile to move to
 * (Tiles that are near high-value tiles have more potential than those near low-value/hurtful tiles)
 */
export function getMapTileScorePotentials(args: { position: number, tiles: Readonly<Tiles> }): { [key in Character]: number | undefined } {
    const { position, tiles } = args;

    const tile = tiles.t[position];

    if (tile === undefined) {
        return {} as { [key in Character]: number };
    }

    if (tile?.score_potential[Character.Bunny]) {
        return tile.score_potential as { [key in Character]: number };
    }

    let possible_directions = Object.values(DirectionalMoves).length;
    let position_potential = 0;

    const potentials: { [key in Character]: number } = {} as { [key in Character]: number };
    for (let key in Character) {
        const species = Character[key as keyof typeof Character];
        const can_go_left = (position - tiles.start) % tiles.width > 0;
        if (!can_go_left) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles.t[position - 1]?.type });
        }
        const can_go_up = (position - tiles.start) - tiles.width > -1
        if (!can_go_up) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles.t[position - tiles.width]?.type });
        }
        const can_go_right = (position - tiles.start) % tiles.width < tiles.width - 1;
        if (!can_go_right) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles.t[position + 1]?.type });
        }
        const can_go_down = position + tiles.width <= tiles.end;
        if (!can_go_down) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles.t[position + tiles.width]?.type });
        }

        potentials[species] = Math.round(getMapTileEffect({ species, tileType: tiles.t[position]?.type }) + (position_potential / possible_directions));
    }

    tile.score_potential = potentials;

    return potentials;
}
