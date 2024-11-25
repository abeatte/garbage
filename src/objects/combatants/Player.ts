import { Tiles } from "../../data/slices/boardSlice";
import { Sight } from "../../data/utils/SightUtils";
import { isValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import CombatantModel from "../../models/CombatantModel";
import { GlobalCombatantStatsModel } from "../../models/GlobalCombatantStatsModel";
import Combatant from "./Combatant";

export default class Player extends Combatant {

    static IsOf(model: { is_player?: boolean }): boolean {
        return !!model.is_player;
    }

    constructor(model: Partial<CombatantModel>, global_combatant_stats?: GlobalCombatantStatsModel) {
        super(model, global_combatant_stats);
        this._model.is_player = true;
    }

    requestMove(args: { sight: Sight; tiles: Readonly<Tiles>; window_width: number; }): number {
        let new_position = this._model.target_waypoints.shift();
        if (isValidCombatantPosition(new_position, args.tiles)) {
            new_position = new_position!;
        } else {
            new_position = this._model.position;
        }
        return new_position;
    }
}