import { Items } from "../../data/slices/boardSlice";
import { addItemToBoard } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { isTileValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import { ItemState, ItemType, Type } from "../../models/ItemModel";
import { TileModel } from "../../models/TileModel";
import CombatantObject from "../combatants/CombatantObject";
import ItemObject from "./ItemObject";

export default class BombObject extends ItemObject {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.Bomb;
    }

    tap(sight: Sight, items: Items, _combatants: { [position: number]: CombatantObject }, _tiles: TileModel[], _window_width: number): void {
        if (this.isFuseUp()) {
            sight.surroundings.forEach(surrounding => {
                if (surrounding === undefined || !isTileValidCombatantPosition(surrounding.tile)) {
                    return;
                }

                items[surrounding.position] = [];

                const c_to_die = surrounding.occupant;
                if (c_to_die !== undefined) {
                    c_to_die.kill();
                    this.recordKill(c_to_die);
                }
            });
            this._model.state = ItemState.Spent;
        } else {
            addItemToBoard(this, items);
        }

        this.tick();
    }
}