import uuid from "react-uuid";
import { Character } from "../components/Combatant";
import { 
    MAX_YOUNGLING_TICK, 
    DIRECTION, 
    getRandomTeam, 
    getSurroundingPos, 
    PosDataKey 
} from "../data/CombatantUtils";
import { Type as TileType } from "./TileModel";
import { Combatants } from "../data/boardSlice";
import { getStrengthRating, GlobalCombatantStatsModel } from "./GlobalCombatantStatsModel";

export enum Strength { Weak = "Weak", Average = "Average", Strong = "Strong", Immortal = "Immortal" }

export interface CombatantModel {
    id: string;
    name: string | undefined;
    tick: number;
    position: number;
    fitness: number;
    strength: keyof typeof Strength;
    immortal: boolean;
    team: keyof typeof Character;
    spawning: CombatantModel | undefined;
}

export function createCombatant(args: {spawn_position: number, global_combatant_stats: GlobalCombatantStatsModel}): CombatantModel {
    return {   
        id: uuid(),
        name: "",
        fitness: 0,
        strength: getStrengthRating({global_combatant_stats: args.global_combatant_stats, fitness: 0, immortal: false}),
        immortal: false,
        team: getRandomTeam(),
        tick: 0,
        position: args.spawn_position,
        spawning: undefined,
    }
}

export function requestMove(args: {combatant: CombatantModel, tiles: TileType[], window_width: number, combatants: Combatants}) {
    const {combatant, tiles, window_width, combatants} = args;
    return getCombatantNextPosition(combatant.position, tiles, window_width, combatants);
}

function getCombatantNextPosition(current_position: number, tiles: TileType[], window_width: number, combatants: Combatants): number {
    let direction;
    let position;
    let attepts = 3;

    const posData = getSurroundingPos({position: current_position, window_width, tiles, combatants});
    const self = posData.combatants.c as CombatantModel;

    const friendly_pos = Object.keys(posData.combatants)
        .filter(
            // not yourself
            key => {
                const ck = key as PosDataKey;
                
                return ck !== PosDataKey.c && 
                // not diagonal
                ck.length === 1 && 
                // present and with same team
                posData.combatants[ck]?.team === self.team &&
                // not already spawning
                !posData.combatants[ck]?.spawning &&
                // are they old enough
                (posData.combatants[ck]?.tick ?? 0) > MAX_YOUNGLING_TICK &&
                // not on fire
                posData.tiles[ck] !== TileType.Fire &&
                // not on water
                posData.tiles[ck] !== TileType.Water
                // TODO: add only mate with similar fitness
            }
        )
        .map(key => {
            const frd = key as PosDataKey

            return posData.positions[frd];
        });

    do {
        direction = Math.floor(Math.random() * Object.values(DIRECTION).length);
        if (friendly_pos.length > 1 && Math.random() > 0.1) {
            position = friendly_pos[Math.floor(Math.random() * friendly_pos.length)];
        } else {
            position = getNewPositionFromDirection(
                current_position, 
                direction, 
                window_width, 
                tiles.length);
        }
        attepts--;
        // avoid fire if you can
    } while (tiles[position] === TileType.Fire && attepts > 0);

    return position;
};

function getNewPositionFromDirection(current_position: number, direction: number, window_width: number, tile_count: number) {
    let new_position = current_position;
    switch (direction) {
        case DIRECTION.left:
            new_position = 
                current_position % window_width > 0 ? 
                    current_position - 1 : current_position;
            break;
        case DIRECTION.up:
            new_position = 
                current_position - window_width > -1 ? 
                    current_position - window_width : current_position;
            break;
        case DIRECTION.right:
            new_position = 
                current_position % window_width < window_width - 1 ? 
                    current_position + 1 : current_position;
            break;
        case DIRECTION.down:
            new_position = 
                current_position + window_width < tile_count ? 
                    current_position + window_width : current_position;
            break;
        case DIRECTION.none:
            // fallthrough
        default:
            new_position = current_position;
            break;            
    }
    return new_position;
};

export default CombatantModel;
