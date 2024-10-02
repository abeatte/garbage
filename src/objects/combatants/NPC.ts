import CombatantObject from "./CombatantObject";

export default class NPC extends CombatantObject {
    static IsOf(model: { position: number }): boolean {
        return model.position !== undefined;
    }
}