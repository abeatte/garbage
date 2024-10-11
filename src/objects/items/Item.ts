import uuid from "react-uuid";
import { Items, Tiles } from "../../data/slices/boardSlice";
import { Sight } from "../../data/utils/SightUtils";
import Combatant from "../combatants/Combatant";
import Entity, { EntityModel } from "../Entity";
import CombatantModel from "../../models/CombatantModel";

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

export default abstract class Item extends Entity<ItemModel> {
    protected _model: ItemModel;

    constructor(model?: { position?: number, type: ItemType });
    constructor(model: ItemModel) {
        super();
        this._model = {
            id: model.id ?? uuid(),
            tick: model.tick ?? 0,
            position: model.position ?? -1,
            type: model.type,
            state: model.state ?? ItemState.Live,
            fuse_length: model?.fuse_length ?? getFuseLength(model.type),
            kills: model.kills ?? 0,
            captured: model.captured ?? [],
        };
    }

    abstract tap(sight: Sight, items: Items, combatants: { [position: number]: Combatant }, tiles: Tiles): void;

    getPosition(): number {
        return this._model.position;
    }
    getID(): String {
        return this._model.id;
    }
    getAge(): number {
        return this._model.tick;
    }

    tick() {
        this._model.tick += 1;
    }

    isSpent() {
        return this._model.state === ItemState.Spent
    }

    getType() {
        return this._model.type;
    }

    isFuseUp() {
        return this._model.fuse_length > 0 && this._model.tick >= this._model.fuse_length;
    }

    recordKill(other: Combatant) {
        this._model.kills += 1;
    }

    toModel(): ItemModel {
        return this._model;
    }
}

function getFuseLength(type: ItemType): number {
    switch (type) {
        case Type.Bomb:
            return 3;
        case Type.PokemonBall:
            return 25;
        case Type.MedPack:
            return -1;
        case SpiderType.FireSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.GrassSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.RockSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.SandSpider:
        // fall-through
        /* eslint-disable-next-line no-fallthrough */
        case SpiderType.WaterSpider:
            return 25;
    }
}