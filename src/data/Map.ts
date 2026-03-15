import { createTileModel, Type as TileType } from "../models/TileModel";
import { DEFAULT_ITEM, SpiderType } from "../objects/items/Item";
import Spider from "../objects/items/Spider";
import { Items, TILE_START, Tiles } from "./slices/boardSlice";
import { addItemToBoard } from "./utils/CombatantUtils";
import { GameMode } from "./utils/GameUtils";
import { viewSurroundings } from "./utils/SightUtils";

export interface MapType {
    name: string;
    game_mode: GameMode,
    generate: ({ width, height }: { width: number, height: number }) => Tiles,
};

// --- Perlin noise implementation ---
function buildPermutation(): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p]; // doubled for overflow-safe indexing
}

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
function grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

function perlin2d(perm: number[], x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v
    );
}

/** Fractional Brownian Motion — stacks octaves for more natural detail */
function fbm(perm: number[], x: number, y: number, octaves = 4): number {
    let value = 0, amplitude = 0.5, frequency = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
        value += perlin2d(perm, x * frequency, y * frequency) * amplitude;
        max += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    return value / max; // normalised to roughly [-1, 1]
}

/** Map a normalised noise value to a tile type using elevation thresholds */
function elevationToTileType(elevation: number, border: boolean): TileType {
    if (border) return TileType.Fire;
    if (elevation < -0.35) return TileType.Void;   // deep voids / chasms
    if (elevation < -0.05) return TileType.Water;  // water bodies
    if (elevation < 0.15)  return TileType.Sand;   // beaches / lowlands
    if (elevation < 0.45)  return TileType.Grass;  // plains
    if (elevation < 0.70)  return TileType.Rock;   // highlands / mountains
    return TileType.Fire;                           // volcanic peaks
}
// ------------------------------------

const Maps: { [name: string]: MapType } = {
    World: {
        name: "World",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            const perm = buildPermutation();
            // scale controls how "zoomed in" the noise is — smaller = broader features
            const scale = 0.18;
            let idx = tiles.start;
            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    const border = h === 0 || h === height - 1 || w === 0 || w === width - 1;
                    const elevation = fbm(perm, w * scale, h * scale);
                    tiles.t[idx] = createTileModel({ index: idx, type: elevationToTileType(elevation, border) });
                    tiles.size++;
                    tiles.end++;
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
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Void });
                tiles.size++;
                tiles.end++;
            }

            const NUM_SPIDERS = width * height / 20
            let spiders: Items = { size: 0, i: {} };
            for (let s = 0; s < NUM_SPIDERS; s++) {
                const spider = new Spider({ ...DEFAULT_ITEM, position: Math.round(Math.random() * (width * height - 1)) + tiles.start, type: SpiderType.SandSpider });
                addItemToBoard(spider, spiders);
            }

            while (spiders.size > 0) {
                const remaining_spiders = { size: 0, i: {} };
                for (const ms in spiders.i) {
                    const models = spiders.i[ms];
                    for (const model in models) {
                        const spider_model = models[model];
                        const sight = viewSurroundings({ ignore_void_tiles: true, position: spider_model.position, tiles });
                        new Spider(spider_model).tap(sight, remaining_spiders, { size: 0, c: {} }, tiles);
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
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Water });
                tiles.size++;
                tiles.end++;
            }

            return tiles;
        }
    },
    Desert: {
        name: "Desert",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Sand });
                tiles.size++;
                tiles.end++;
            }

            return tiles;
        }
    },
    Meadow: {
        name: "Meadow",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Grass });
                tiles.size++;
                tiles.end++;
            }

            return tiles;
        }
    },
    Mountain: {
        name: "Mountain",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Rock });
                tiles.size++;
                tiles.end++;
            }

            return tiles;
        }
    },
    "The Sun": {
        name: "The Sun",
        game_mode: GameMode.God,
        generate: ({ width, height }) => {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            for (let index = tiles.start; index < tiles.start + width * height; index++) {
                tiles.t[index] = createTileModel({ index, type: TileType.Fire });
                tiles.size++;
                tiles.end++;
            }

            return tiles;
        }
    },
    Adventure: {
        name: "Adventure",
        game_mode: GameMode.Adventure,
        generate: function ({ width, height }: { width: number; height: number; }) {
            const tiles: Tiles = { width, height, start: TILE_START, end: TILE_START, size: 0, t: {} };
            const platform_start = Math.ceil((width - 3) / 2);
            for (let i = 0; i < 9; i++) {
                const idx = platform_start + (i % 3) + (Math.floor(i / 3) * width);
                tiles.t[idx + tiles.start] = createTileModel({ index: idx + tiles.start, type: TileType.Sand });
                tiles.size++;
                tiles.end = idx + tiles.start;
            }

            return tiles;
        }
    }
};

export default Maps;
