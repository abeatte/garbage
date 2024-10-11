import { Combatants, Items, Tiles } from "../../data/slices/boardSlice";
import { addItemToBoard, GetCombatant, MIN_HEALTH } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { isTileValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import Item, { ItemType, Type } from "./Item";

export default class MedPack extends Item {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.MedPack;
    }

    tap(sight: Sight, items: Items, combatants: Combatants, _tiles: Tiles): void {
        if (sight.center === undefined || !isTileValidCombatantPosition(sight.center.tile)) {
            return;
        }
        const occupant = GetCombatant(combatants.c[sight.center.position]);
        if (occupant) {
            occupant.affectFitness(-MIN_HEALTH);
        } else {
            addItemToBoard(this, items);
        }

        this.tick();
    }

}