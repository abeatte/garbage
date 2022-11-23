import { DIRECTION } from "../data/CombatantUtils";

export enum Type {Void = "Void", Water = "Water", Fire = "Fire", Rock = "Rock", Sand = "Sand", Grass ="Grass"};

export interface TileModel {
    index: number, 
    type: Type,
    score_potential: number,
    tile_effect: number,
}

export function createTileModel(args: {index: number, type: Type}): TileModel {
    return {
        index: args.index,
        type: args.type,
        score_potential: 0,
        tile_effect: getMapTileEffect(args.type),
    }
}

/**
 * @returns the given tile's effect on fitness
 */
 export function getMapTileEffect(tileType: Type) {
    if (tileType === Type.Fire) {
        // fire hurts bad
        return -50;
    } else if (tileType === Type.Water) {
        // water hurts a bit
        return -5;
    } else if (tileType === Type.Grass) {
        // grass is very good
        return 50;       
    } else {
        // lame, you get nothing
        return 0;
    }
};

export function updateMapTileScorePotentials(tiles: TileModel[], window_width: number) {
    tiles.forEach((t, idx) => t.score_potential = 
        Math.round(getMapTileScorePotential({position: idx, tiles, window_width})));
}

/**
 * @returns the given tile's potential as a tile to move to
 * (Tiles that are near high-value tiles have more potential than those near low-value/hurtful tiles)
 */
 function getMapTileScorePotential(args: {position: number, tiles: TileModel[], window_width: number}): number {
    const {position, tiles, window_width} = args;

    let possible_directions = Object.values(DIRECTION).length - 1;
    let position_potential = 0;
                                            
    const can_go_left = position % window_width > 0;
    if (!can_go_left) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect(tiles[position - 1].type);
    }
    const can_go_up = position - window_width > -1
    if (!can_go_up) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect(tiles[position - window_width].type);
    }
    const can_go_right = position % window_width < window_width - 1;
    if (!can_go_right) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect(tiles[position + 1].type);
    }
    const can_go_down = position + window_width < tiles.length;  
     if (!can_go_down) {
        possible_directions--;
    } else {
        position_potential += getMapTileEffect(tiles[position + window_width].type);
    }
    
    // TODO: in the future, take into account an occupient of nearby tiles and their strengths;
    
    return getMapTileEffect(tiles[position].type) + (position_potential / possible_directions);
}
