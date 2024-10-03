import Combatant from "./Combatant";

export default class NPC extends Combatant {
    static IsOf(model: { position: number }): boolean {
        return model.position !== undefined;
    }
}