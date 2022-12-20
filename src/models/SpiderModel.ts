import { createItemModel, ItemModel } from "./ItemModel";
import { Type as TileType } from "./TileModel";
import { Type as ItemType } from "./ItemModel";

export enum Type { WaterSpider = "WaterSpider", FireSpider = "FireSpider", RockSpider = "RockSpider", SandSpider = "SandSpider" };

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
    }
}

export function createSpiderModel({position, type}: {position: number, type: Type}): SpiderModel {
    const ret = createItemModel({position, type: ItemType.Spider }) as SpiderModel;
    ret.spider_type = type;
    ret.tile_action = getTileType(type);
    return ret;
}
