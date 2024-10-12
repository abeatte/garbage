import CombatantModel from "../../models/CombatantModel";
import Combatant from "./Combatant";

export default class NPC extends Combatant {
    static IsOf(model: Partial<CombatantModel>): boolean {
        return model.position !== undefined;
    }
}