import { createTileModel, Type as TileType } from "../models/TileModel";
import { SpiderType } from "../objects/items/Item";
import Spider from "../objects/items/Spider";
import { Items, Tiles } from "./slices/boardSlice";
import { addItemToBoard } from "./utils/CombatantUtils";
import { GameMode } from "./utils/GameUtils";
import { viewSurroundings } from "./utils/SightUtils";

export interface MapType {
    name: string;
    game_mode: GameMode,
    generate: ({ width, height }: { width: number, height: number }) => Tiles,
};

const Maps: { [name: string]: MapType } = {
    World: {
        name: "World",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            let idx = 0;
            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    if (h === 0 || h === height - 1 || w === 0 || w === width - 1) {
                        tiles.t[idx] = createTileModel({ index: idx, type: TileType.Fire });
                    } else if (h > height / 5 && h < height / 5 * 4 && w > width / 5 && w < width / 5 * 4) {
                        tiles.t[idx] = createTileModel({
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
                        tiles.t[idx] = createTileModel({
                            index: idx,
                            type: Math.random() < 0.2 ?
                                TileType.Void :
                                TileType.Sand,
                        });
                    }
                    tiles.size++;
                    idx++;
                }
            }
            return tiles;
        }
    },
    Chasms: {
        name: "Chasms",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let index = 0; index < width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Void });
                tiles.size++;
            }

            const NUM_SPIDERS = width * height / 20
            let spiders: Items = { size: 0, i: {} };
            for (let s = 0; s < NUM_SPIDERS; s++) {
                const spider = new Spider({ position: Math.round(Math.random() * (width * height - 1)), type: SpiderType.SandSpider });
                addItemToBoard(spider, spiders);
            }

            while (spiders.size > 0) {
                const remaining_spiders = { size: 0, i: {} };
                for (const ms in spiders.i) {
                    const models = spiders.i[ms];
                    for (const model in models) {
                        const spider_model = models[model];
                        const sight = viewSurroundings({ ignore_void_tiles: true, position: spider_model.position, tiles, window_width: width });
                        new Spider(spider_model).tap(sight, remaining_spiders, { size: 0, c: {} }, tiles, width);
                    }
                }
                spiders = remaining_spiders;
            }

            return tiles;
        }
    },
    Ocean: {
        name: "Ocean",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Water });
                tiles.size++;
            }

            return tiles;
        }
    },
    Desert: {
        name: "Desert",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Sand });
                tiles.size++;
            }

            return tiles;
        }
    },
    Meadow: {
        name: "Meadow",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Grass });
                tiles.size++;
            }

            return tiles;
        }
    },
    Mountain: {
        name: "Mountain",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Rock });
                tiles.size++;
            }

            return tiles;
        }
    },
    "The Sun": {
        name: "The Sun",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Fire });
                tiles.size++;
            }

            return tiles;
        }
    },
    Adventure: {
        name: "Adventure",
        game_mode: GameMode.Adventure,
        generate: function ({ width, height }: { width: number; height: number; }) {
            const tiles: Tiles = { size: 0, t: {} };
            for (let idx = 0; idx < width * height; idx++) {
                tiles.t[idx] = createTileModel({ index: idx, type: TileType.Sand });
                tiles.size++;
            }

            return tiles;
        }
    }
};

export default Maps;
