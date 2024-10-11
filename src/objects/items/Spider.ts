import { Combatants, Items, Tiles } from "../../data/slices/boardSlice";
import { addItemToBoard } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { clearMapTileScorePotentials, createTileModel, Type as TileType } from "../../models/TileModel";
import Item, { ItemType, SpiderType } from "./Item"

export default class Spider extends Item {

    static IsOf(model: { type: ItemType | SpiderType }): boolean {
        return Object.keys(SpiderType).includes(model.type);
    }

    tap(sight: Sight, items: Items, _combatants: Combatants, tiles: Tiles): void {
        const new_position = sight.getNewRandomPosition();
        if (!this.isFuseUp()) {
            paintTileForSpider(this, tiles);
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

function paintTileForSpider(spider: Spider, tiles: Tiles) {
    addTileToMap(spider.getPosition(), spider.getActionType(), tiles);
}

export function addTileToMap(index: number, type: TileType, tiles: Tiles) {
    if (tiles.t[index] === undefined) {
        tiles.size++;
    }
    // this only adds a single row above at a time
    if (index < tiles.start) {
        tiles.start -= tiles.width;
    }
    if (index > tiles.end) {
        tiles.end += tiles.width;
    }
    tiles.t[index] = createTileModel({ index, type });
    clearMapTileScorePotentials({ position: index, tiles });
}