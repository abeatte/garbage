import { isValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import { DecisionType } from "../../models/CombatantModel";
import { TileModel } from "../../models/TileModel";
import Combatant from "./Combatant";

export default class Seeker extends Combatant {

    static IsOf(model: { decision_type?: DecisionType }): boolean {
        return model.decision_type === DecisionType.Seeker;
    }

    beBorn(position: number, friendlies: Combatant[]): void {
        super.beBorn(position, friendlies);
        this._model.target_waypoints.push(position);
    }

    requestMoveImpl(args: { tiles: Readonly<TileModel[]>, window_width: number, best_target_position: number; best_mate_position: number; best_open_position: number; new_random_position: number; }): number {
        const self = this._model;
        let position;
        // seekers go directly toward their target.
        let target_destination = self.target_waypoints[0];
        if (
            // nowhere to go
            target_destination === undefined ||
            // already got there
            target_destination === self.position ||
            // can't get there
            !isValidCombatantPosition(target_destination, args.tiles)
        ) {
            target_destination = self.position;
            self.target_waypoints = getSeekerPath(args.tiles);
        }

        const col_diff =
            (target_destination % args.window_width) -
            (self.position % args.window_width);
        const row_diff =
            Math.floor(target_destination / args.window_width) -
            Math.floor(self.position / args.window_width);

        const col_movement_is_greater = Math.abs(col_diff) > Math.abs(row_diff);
        const col_movement_position = self.position + (row_diff < 0 ? - args.window_width : args.window_width);
        const row_movement_position = self.position + (col_diff < 0 ? -1 : 1);
        const is_col_movement_valid = isValidCombatantPosition(col_movement_position, args.tiles);
        const is_row_movement_valid = isValidCombatantPosition(row_movement_position, args.tiles);

        if (col_diff === 0 && row_diff === 0) {
            position = self.position;
        } else if ((col_movement_is_greater || !is_col_movement_valid) && is_row_movement_valid) {
            position = row_movement_position;
        } else if (is_col_movement_valid) {
            position = col_movement_position;
        } else {
            position = self.position;
            // TODO: hack to reset target position when you run into a wall.
            self.target_waypoints = getSeekerPath(args.tiles);
        }

        return position;
    }
}

function getSeekerPath(tiles: Readonly<TileModel[]>): number[] {
    const waypoints = [];
    waypoints.push(Math.floor(Math.random() * (tiles.length - 1)));

    // TODO: add more logic for paths

    return waypoints;
}