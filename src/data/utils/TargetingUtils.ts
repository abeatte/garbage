import CombatantModel from "../../models/CombatantModel";
import { Combatants } from "../slices/boardSlice";

export function getCombatantAtTarget(args: { target: number | undefined, player: CombatantModel | undefined, combatants: Combatants }): CombatantModel | undefined {
    if (args.target === undefined || args.target < 0) return undefined;
    return args.player?.position === args.target ? args.player : args.combatants.c[args.target];
}
