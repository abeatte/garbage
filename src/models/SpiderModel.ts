import { createItemModel, ItemModel } from "./ItemModel";
import { clearMapTileScorePotentials, createTileModel, TileModel, Type as TileType } from "./TileModel";
import { Type as ItemType } from "./ItemModel";

export enum Type { WaterSpider = "WaterSpider", FireSpider = "FireSpider", RockSpider = "RockSpider", SandSpider = "SandSpider", GrassSpider = "GrassSpider" };

export interface SpiderModel extends ItemModel {
    spider_type: Type;
    tile_action: TileType;
}

function getTileType(type: Type): TileType {
    switch (type) {
        case Type.WaterSpider:
            return TileType.Water;
        case Type.FireSpider:
            return TileType.Fire;
        case Type.RockSpider:
            return TileType.Rock;
        case Type.SandSpider:
            return TileType.Sand;
        case Type.GrassSpider:
            return TileType.Grass;
    }
}

export function createSpiderModel({ position, type }: { position: number, type: Type }): SpiderModel {
    const ret = createItemModel({ position, type: ItemType.Spider }) as SpiderModel;
    ret.spider_type = type;
    ret.tile_action = getTileType(type);
    return ret;
}

export function paintTileForSpider(spider: SpiderModel, tiles: TileModel[], window_width: number) {
    tiles[spider.position] =
        createTileModel({ index: spider.position, type: spider.tile_action });
    clearMapTileScorePotentials({ position: spider.position, tiles, window_width });
}
