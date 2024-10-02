import { Items } from "../../data/slices/boardSlice";
import { addItemToBoard, MIN_HEALTH } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { TileModel } from "../../models/TileModel";
import CombatantObject from "../combatants/CombatantObject";
import ItemObject, { ItemType, Type } from "./Item";

export default class MedPackObject extends ItemObject {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.MedPack;
    }

    tap(sight: Sight, items: Items, _combatants: { [position: number]: CombatantObject }, _tiles: TileModel[], _window_width: number): void {
        const occupant = sight.center?.occupant;
        if (occupant) {
            occupant.affectFitness(-MIN_HEALTH);
        } else {
            addItemToBoard(this, items);
        }

        this.tick();
    }

}