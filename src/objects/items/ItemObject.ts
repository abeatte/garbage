import uuid from "react-uuid";
import { Items } from "../../data/slices/boardSlice";
import { Sight } from "../../data/utils/SightUtils";
import { ItemModel, ItemState, ItemType, SpiderType, Type } from "../../models/ItemModel";
import { TileModel } from "../../models/TileModel";
import CombatantObject from "../combatants/CombatantObject";
import EntityObject from "../EntityObject";

export default abstract class ItemObject extends EntityObject<ItemModel> {
    protected _model: ItemModel;

    constructor(model?: { type: ItemType });
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

    abstract tap(sight: Sight, items: Items, combatants: { [position: number]: CombatantObject }, tiles: TileModel[], window_width: number): void;

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

    recordKill(other: CombatantObject) {
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