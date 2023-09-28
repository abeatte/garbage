import { LegalMoves } from "../data/CombatantUtils";
import { Character, getMapTileEffect } from "./CombatantModel";

export enum Type {Void = "Void", Water = "Water", Fire = "Fire", Rock = "Rock", Sand = "Sand", Grass ="Grass"};

export interface TileModel {
    index: number, 
    type: Type,
    score_potential: {[species: string]: number},
}

export function createTileModel(args: {index: number, type: Type}): TileModel {
    return {
        index: args.index,
        type: args.type,
        score_potential: {},
    }
}

export function updateMapTileScorePotentials(tiles: TileModel[], window_width: number) {

    tiles.forEach((t, idx) => {
        Object.values(Character).forEach(c => {
            t.score_potential[c] = 
        getMapTileScorePotential({species: c, position: idx, tiles, window_width});
        });
    });
}

/**
 * @returns the given tile's potential as a tile to move to
 * (Tiles that are near high-value tiles have more potential than those near low-value/hurtful tiles)
 */
 export function getMapTileScorePotential(args: {species: Character, position: number, tiles: TileModel[], window_width: number}): number {
    const {species, position, tiles, window_width} = args;

    let possible_directions = Object.values(LegalMoves).length - 2;
    let position_potential = 0;
                                            
    const can_go_left = position % window_width > 0;
    if (!can_go_left) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect({species, tileType: tiles[position - 1].type});
    }
    const can_go_up = position - window_width > -1
    if (!can_go_up) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect({species, tileType: tiles[position - window_width].type});
    }
    const can_go_right = position % window_width < window_width - 1;
    if (!can_go_right) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect({species, tileType: tiles[position + 1].type});
    }
    const can_go_down = position + window_width < tiles.length;  
     if (!can_go_down) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect({species, tileType: tiles[position + window_width].type});
    }
    
    // TODO: in the future, take into account an occupient of nearby tiles and their strengths;
    
    return Math.round(getMapTileEffect({species, tileType: tiles[position].type}) + (position_potential / possible_directions));
}
