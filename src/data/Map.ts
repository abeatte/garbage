import { createTileModel, TileModel, Type as TileType } from "../models/TileModel";
import { ItemModel, SpiderType } from "../objects/items/Item";
import Spider from "../objects/items/Spider";
import { addItemToBoard } from "./utils/CombatantUtils";
import { Sight, viewSurroundings } from "./utils/SightUtils";

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
                                    Math.random() < 0.1 ?
                                        TileType.Void :
                                        TileType.Rock,
                        });
                    } else {
                        tiles[idx] = createTileModel({
                            index: idx,
                            type: Math.random() < 0.2 ?
                                TileType.Void :
                                TileType.Sand,
                        });
                    }
                    idx++;
                }
            }
            return tiles;
        }
    },

    Chasms: {
        name: "Chasms",
        generate: ({ width, height }) => {
            const tiles = Array(width * height) as TileModel[];
            for (let index = 0; index < width * height; index++) {
                tiles[index] = createTileModel({ index, type: TileType.Void });
            }

            const NUM_SPIDERS = width * height / 20
            let spiders = {} as { [position: number]: ItemModel[] | undefined };
            for (let s = 0; s < NUM_SPIDERS; s++) {
                const spider = new Spider({ position: Math.round(Math.random() * (tiles.length - 1)), type: SpiderType.SandSpider });
                addItemToBoard(spider, spiders);
            }

            while (Object.values(spiders).length > 0) {
                const remaining_spiders = {};
                for (const models of Object.values(spiders)) {
                    for (const model in models) {
                        const spider_model = models[model as unknown as number];
                        const sight = viewSurroundings({ ignore_void_tiles: true, position: spider_model.position, tiles, window_width: width }) // { getNewRandomPosition: () => LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)] };
                        new Spider(spider_model).tap(sight as Sight, remaining_spiders, {}, tiles, width);
                    }
                }
                spiders = remaining_spiders;
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
