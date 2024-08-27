import { createTileModel, TileModel, Type as TileType } from "../models/TileModel";

export interface MapType {
    name: string;
    generate: ({ width, height }: { width: number, height: number }) => TileModel[],
};

const Maps: { [name: string]: MapType } = {
    World: {
        name: "World",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            let idx = 0;
            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    if (h === 0 || h === height - 1 || w === 0 || w === width - 1) {
                        tiles[idx] = createTileModel({ index: idx, type: TileType.Fire });
                    } else if (h > height / 5 && h < height / 5 * 4 && w > width / 5 && w < width / 5 * 4) {
                        tiles[idx] = createTileModel({
                            index: idx,
                            type: Math.random() < 0.1 ?
                                TileType.Grass :
                                Math.random() < 0.1 ?
                                    TileType.Water :
                                    TileType.Rock,
                        });
                    } else {
                        tiles[idx] = createTileModel({ index: idx, type: TileType.Sand });
                    }
                    idx++;
                }
            }
            return tiles;
        }
    },
    Ocean: {
        name: "Ocean",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let idx = 0; idx < tiles.length; idx++) {
                tiles[idx] = createTileModel({ index: idx, type: TileType.Water });
            }

            return tiles;
        }
    },
    Desert: {
        name: "Desert",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let idx = 0; idx < tiles.length; idx++) {
                tiles[idx] = createTileModel({ index: idx, type: TileType.Sand });
            }

            return tiles;
        }
    },
    Meadow: {
        name: "Meadow",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let idx = 0; idx < tiles.length; idx++) {
                tiles[idx] = createTileModel({ index: idx, type: TileType.Grass });
            }

            return tiles;
        }
    },
    Mountain: {
        name: "Mountain",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let idx = 0; idx < tiles.length; idx++) {
                tiles[idx] = createTileModel({ index: idx, type: TileType.Rock });
            }

            return tiles;
        }
    },
    "The Sun": {
        name: "The Sun",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let idx = 0; idx < tiles.length; idx++) {
                tiles[idx] = createTileModel({ index: idx, type: TileType.Fire });
            }

            return tiles;
        }
    },
};

export default Maps;
