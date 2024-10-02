import CombatantModel from "./CombatantModel";
import { EntityModel } from "./EntityModel";

export enum SpiderType { WaterSpider = "WaterSpider", FireSpider = "FireSpider", RockSpider = "RockSpider", SandSpider = "SandSpider", GrassSpider = "GrassSpider" };
export enum Type { Bomb = "Bomb", PokemonBall = "PokemonBall", MedPack = "MedPack" };
export type ItemType = Type | SpiderType;
export enum ItemState { Spent = "Spent", Live = "Live" };

export const MAX_TILE_ITEM_COUNT = 4;

export interface ItemModel extends EntityModel {
    type: ItemType;
    state: ItemState;
    fuse_length: number;
    kills: number;
    captured: CombatantModel[];
}
