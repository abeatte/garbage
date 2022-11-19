import uuid from "react-uuid";
import { Character } from "../components/Combatant";
import { 
    MAX_YOUNGLING_TICK, 
    DIRECTION,
    getSurroundingPos,
    ClockFace, 
} from "../data/CombatantUtils";
import { TileModel } from "./TileModel";
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
    mating_with_id: string | undefined;
    children: number,
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
        mating_with_id: undefined,
        children: 0,
    }
}

export function requestMove(args: {combatant: CombatantModel, tiles: TileModel[], window_width: number, combatants: Combatants}) {
    const {combatant, tiles, window_width, combatants} = args;
    return getCombatantNextPosition(combatant.position, tiles, window_width, combatants);
}

function getCombatantNextPosition(current_position: number, tiles: TileModel[], window_width: number, combatants: Combatants): number {
    let direction;
    let position;
    let attepts = 3;

    const posData = getSurroundingPos({position: current_position, window_width, tiles, combatants});
    const self = posData.surroundings[ClockFace.c].occupant as CombatantModel;

    const mate_positions = [] as number[],
    enemy_positions = [] as number[], 
    empty_positions = [] as number[];

    posData.surroundings.forEach((surrounding, idx, s_arr) => {
        const {position, occupant: c, tile} = surrounding;

        const illegal_moves = [ClockFace.c, ClockFace.bl, ClockFace.br, ClockFace.tl, ClockFace.tr]
        if (illegal_moves.includes(idx)) {
            // don't count yourself or diagonal positions
            return;
        }

        if (!c) {
            if (position > -1 && position < window_width) {
                empty_positions.push(position)
            }
        } else if (
            c.team === self.team && 
            !c.mating_with_id && 
            c.tick > MAX_YOUNGLING_TICK && 
            (tile?.tile_effect ?? -1) > -1
        ) {
            mate_positions.push(position);
        } else {
            enemy_positions.push(position);
        }
    });

    do {
        direction = Math.floor(Math.random() * Object.values(DIRECTION).length);
        if (mate_positions.length > 1 && Math.random() > 0.1) {
            position = mate_positions[Math.floor(Math.random() * mate_positions.length)];
        } else {
            position = getNewPositionFromDirection(
                current_position, 
                direction, 
                window_width, 
                tiles.length);
        }
        attepts--;
        // avoid fire if you can
    } while (tiles[position].tile_effect < 0 && attepts > 0);

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

export function getRandomTeam(): keyof typeof Character  {
    const set = Object.keys(Character);
    return set[Math.round(Math.random() * (set.length - 1))] as keyof typeof Character;
}

export default CombatantModel;
