import { Items, Tiles } from "../../data/slices/boardSlice";
import { addItemToBoard, GetCombatant } from "../../data/utils/CombatantUtils";
import { Sight } from "../../data/utils/SightUtils";
import { isTileValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import Combatant from "../combatants/Combatant";
import Item, { ItemType, Type } from "./Item"

export default class PokemonBall extends Item {

    static IsOf(model: { type: ItemType }): boolean {
        return model.type === Type.PokemonBall;
    }

    tap(sight: Sight, items: Items, combatants: { [position: number]: Combatant }, _tiles: Tiles, _window_width: number): void {
        const valid_surroundings =
            sight.surroundings.filter(sur => isTileValidCombatantPosition(sur?.tile));
        const capacity = valid_surroundings.length;

        if (this.isFuseUp()) {
            const captives = this._model.captured;
            this._model.captured = [];

            while (captives.length > 0) {
                const captive = GetCombatant(captives.pop());
                const surrounding = valid_surroundings.pop();
                if (captive === undefined || surrounding === undefined) {
                    continue;
                }

                // time passes for the captive
                captive.releaseFromCaptivity(this._model.fuse_length);

                const occupant = surrounding.occupant;

                if (occupant === undefined) {
                    captive.setPosition(surrounding.position);
                    combatants[captive.getPosition()] = captive;
                } else {
                    const winner = occupant.fightWith(captive);
                    winner.setPosition(surrounding.position);
                    combatants[winner.getPosition()] = winner;
                }
            }
        } else {
            if (this._model.captured.length < capacity) {
                // can only store as many tiles as it can disgorge into
                sight.surroundings.forEach(surrounding => {
                    const c_to_capture = surrounding?.occupant;
                    if (c_to_capture) {
                        c_to_capture.capture();
                        this._model.captured.push(c_to_capture.toModel());
                    }
                });
            }
            addItemToBoard(this, items);
        }

        this.tick();
    }
}