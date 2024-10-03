import { Items } from "../../data/slices/boardSlice";
import { addItemToBoard, MIN_HEALTH } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { TileModel } from "../../models/TileModel";
import Combatant from "../combatants/Combatant";
import Item, { ItemType, Type } from "./Item";

export default class MedPack extends Item {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.MedPack;
    }

    tap(sight: Sight, items: Items, _combatants: { [position: number]: Combatant }, _tiles: TileModel[], _window_width: number): void {
        const occupant = sight.center?.occupant;
        if (occupant) {
            occupant.affectFitness(-MIN_HEALTH);
        } else {
            addItemToBoard(this, items);
        }

        this.tick();
    }

}