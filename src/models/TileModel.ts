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

export function clearMapTileScorePotentials(args: { position: number, tiles: TileModel[], window_width: number }): void {
    const { position, tiles, window_width } = args;

    // center
    tiles[position].score_potential = {};
    let bounds = position % window_width;
    // left
    if (bounds > 0) {
        tiles[position - 1].score_potential = {};
    }
    bounds = position - window_width;
    // up
    if (bounds > -1) {
        tiles[position - window_width].score_potential = {};
    }
    bounds = position % window_width;
    // right
    if (bounds < window_width - 1) {
        tiles[position + 1].score_potential = {};
    }
    bounds = position + window_width;
    // down
    if (bounds < tiles.length) {
        tiles[position + window_width].score_potential = {};
    }
}

/**
 * @returns the given tile's potential as a tile to move to
 * (Tiles that are near high-value tiles have more potential than those near low-value/hurtful tiles)
 */
export function getMapTileScorePotentials(args: { position: number, tiles: TileModel[], window_width: number }): { [key in Character]: number } {
    const { position, tiles, window_width } = args;

    const tile = tiles[position];

    if (tile?.score_potential[Character.Bunny]) {
        return tile.score_potential as { [key in Character]: number };
    }

    let possible_directions = Object.values(DirectionalMoves).length;
    let position_potential = 0;

    const potentials = {} as { [key in Character]: number };
    for (let key in Character) {
        const species = Character[key as keyof typeof Character];
        const can_go_left = position % window_width > 0;
        if (!can_go_left) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles[position - 1].type });
        }
        const can_go_up = position - window_width > -1
        if (!can_go_up) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles[position - window_width].type });
        }
        const can_go_right = position % window_width < window_width - 1;
        if (!can_go_right) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles[position + 1].type });
        }
        const can_go_down = position + window_width < tiles.length;
        if (!can_go_down) {
            possible_directions--;
        } else {
            position_potential += getMapTileEffect({ species, tileType: tiles[position + window_width].type });
        }

        // TODO: in the future, take into account an occupient of nearby tiles and their strengths;

        potentials[species] = Math.round(getMapTileEffect({ species, tileType: tiles[position].type }) + (position_potential / possible_directions));
    }

    tile.score_potential = potentials;

    return potentials;
}
