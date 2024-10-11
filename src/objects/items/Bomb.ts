import { Combatants, Items, Tiles } from "../../data/slices/boardSlice";
import { addItemToBoard, GetCombatant } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { isTileValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import Item, { ItemState, ItemType, Type } from "./Item";

export default class Bomb extends Item {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.Bomb;
    }

    tap(sight: Sight, items: Items, combatants: Combatants, _tiles: Tiles): void {
        if (this.isFuseUp()) {
            sight.surroundings.forEach(surrounding => {
                if (surrounding === undefined || !isTileValidCombatantPosition(surrounding.tile)) {
                    return;
                }

                const item_count = items.i[surrounding.position]?.length ?? 0;
                items.i[surrounding.position] = [];
                items.size -= item_count;

                const c_to_die = GetCombatant(combatants.c[surrounding.position]);
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