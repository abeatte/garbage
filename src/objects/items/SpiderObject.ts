import { Items } from "../../data/slices/boardSlice";
import { addItemToBoard } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { clearMapTileScorePotentials, createTileModel, TileModel, Type as TileType } from "../../models/TileModel";
import CombatantObject from "../combatants/CombatantObject";
import ItemObject, { ItemType, SpiderType } from "./Item"

export default class SpiderObject extends ItemObject {

    static IsOf(model: { type: ItemType | SpiderType }): boolean {
        return Object.keys(SpiderType).includes(model.type);
    }

    tap(sight: Sight, items: Items, combatants: { [position: number]: CombatantObject }, tiles: TileModel[], window_width: number): void {
        const new_position = sight.getNewRandomPosition();
        if (!this.isFuseUp()) {
            paintTileForSpider(this, tiles, window_width);
            this._model.position = new_position;
            addItemToBoard(this, items);
        }

        this.tick();
    }

    getActionType(): TileType {
        switch (this._model.type) {
            case SpiderType.WaterSpider:
                return TileType.Water;
            case SpiderType.FireSpider:
                return TileType.Fire;
            case SpiderType.RockSpider:
                return TileType.Rock;
            case SpiderType.SandSpider:
                return TileType.Sand;
            case SpiderType.GrassSpider:
                return TileType.Grass;
            default:
                return TileType.Void;
        }
    }
}

function paintTileForSpider(spider: SpiderObject, tiles: TileModel[], window_width: number) {
    tiles[spider.getPosition()] =
        createTileModel({ index: spider.getPosition(), type: spider.getActionType() });
    clearMapTileScorePotentials({ position: spider.getPosition(), tiles, window_width });
}