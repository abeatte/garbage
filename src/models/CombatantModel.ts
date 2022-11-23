import uuid from "react-uuid";
import { Character } from "../components/Combatant";
import { 
    MAX_YOUNGLING_TICK, 
    DIRECTION,
    getSurroundingPos,
    ClockFace,
    Surroundings, 
} from "../data/CombatantUtils";
import { TileModel } from "./TileModel";
import { getStrengthRating, GlobalCombatantStatsModel } from "./GlobalCombatantStatsModel";

export enum Strength { Weak = "Weak", Average = "Average", Strong = "Strong", Immortal = "Immortal" };
export enum State { Spawning = "spawning", Alive = "alive", Mating = "mating", Dead = "dead" };

export interface CombatantModel {
    id: string;
    name: string | undefined;
    state: State;
    tick: number;
    position: number;
    kills: number;
    fitness: number;
    strength: keyof typeof Strength;
    immortal: boolean;
    team: keyof typeof Character;
    spawn: CombatantModel | undefined;
    children: number,
}

export function createCombatant(args: {spawn_position: number, global_combatant_stats: GlobalCombatantStatsModel}): CombatantModel {
    return {   
        id: uuid(),
        name: "",
        state: State.Spawning, 
        kills: 0,
        fitness: 0,
        strength: getStrengthRating({global_combatant_stats: args.global_combatant_stats, fitness: 0, immortal: false}),
        immortal: false,
        team: getRandomTeam(),
        tick: 0,
        position: args.spawn_position,
        spawn: undefined,
        children: 0,
    }
}

function b_vs_a_strength(a: Strength | undefined, b: Strength | undefined): number {
    if (b === undefined) {
        return -1;
    } else if (a === undefined) {
        return 1;
    } else if (b === a) {
        return 0;
    } else if (b === Strength.Immortal) {
        return 1;
    } else if (b === Strength.Strong && a !== Strength.Immortal) {
        return 1;
    } else if (b === Strength.Average && (a !== Strength.Immortal && a !== Strength.Strong)) {
        return 1;
    } else { 
        return -1;
    }
};

export function requestMove({random_walk_enabled, current_position, tiles, window_width, combatants}:
    {random_walk_enabled: boolean, 
    current_position: number, 
    tiles: TileModel[], 
    window_width: number, 
    combatants: {[position: number]: CombatantModel | undefined}
}): number {
    const posData = getSurroundingPos({position: current_position, window_width, tiles, combatants});
    const self = (posData.surroundings[ClockFace.c] as Surroundings).occupant as CombatantModel;

    // returns negative if B is stronger
    const strength_sort = (a: CombatantModel | undefined, b: CombatantModel | undefined): number => {
        const bs = b?.strength, as = a?.strength;
        return b_vs_a_strength(as as Strength | undefined, bs as Strength | undefined);
    };

    let potential_mates = [] as CombatantModel[],
    enemies = [] as CombatantModel[], 
    empty_positions = [] as number[];

    posData.surroundings.forEach((surrounding, idx, s_arr) => {
        if (!surrounding) {
            return;
        }

        const {position, occupant: c, tile} = surrounding;

        const illegal_moves = [ClockFace.c, ClockFace.bl, ClockFace.br, ClockFace.tl, ClockFace.tr]
        if (illegal_moves.includes(idx)) {
            // don't count yourself or diagonal positions
            return;
        }

        if (!c) {
            if (position > -1 && position < tiles.length) {
                empty_positions.push(position)
            }
        } else if (
            // same team
            c.team === self.team && 
            // not already 'engaged'
            c.state !== State.Mating && 
            // not too young
            c.tick > MAX_YOUNGLING_TICK && 
            // not on hurtful tile
            (tile?.tile_effect ?? -1) > -1
        ) {
            potential_mates.push(c);
        } else if (
            // enemy
            c.team !== self.team
        ) {
            enemies.push(c);
        }
    });

    potential_mates = potential_mates.sort(strength_sort);

    const bucketed_enemy_strengths = Object.values(enemies).reduce((buckets, e) => {
        const strength = e.strength;
        const position = e.position;
        if (buckets[strength] === undefined) {
            buckets[strength] = [];
        }
        const bucket = buckets[strength];
        bucket.push(position);
        return buckets;
    }, {} as {[key: string]: number[]});

    const bucketed_potential_ranked_tiles = Object.values(posData.surroundings).reduce((buckets, s) => {
        const tile = s?.tile;
        if (tile !== undefined) {
            const position = tile.index;
            if (empty_positions.includes(position)) {
                if (buckets[tile.score_potential] === undefined) {
                    buckets[tile.score_potential] = [];
                }
                const bucket = buckets[tile.score_potential];
                bucket.push(position);
            }
        }
        return buckets;
    }, {} as {[key: number]: number[]});

    let position;
    let attepts = 3;
    do {
        const best_hunter_bucket = bucketed_enemy_strengths[Object.keys(bucketed_enemy_strengths)
            .sort((a, b) => b_vs_a_strength(a as Strength, b as Strength))
            .filter(s => b_vs_a_strength(s as Strength, self.strength as Strength) > 0)[0]];
        const best_hunter_position = best_hunter_bucket?.length > 0 ?
            best_hunter_bucket[Math.floor(Math.random() * best_hunter_bucket.length)] : undefined;

        // position based on best safe space
        const best_safe_position_bucket = bucketed_potential_ranked_tiles[Object.keys(bucketed_potential_ranked_tiles)
            .sort((a, b) => parseInt(b) - parseInt(a))[0] as unknown as number]
        const best_safe_position = best_safe_position_bucket?.length > 0 ? 
            best_safe_position_bucket[Math.floor(Math.random() * best_safe_position_bucket.length)] : undefined;

        // position based on best mate space
        const best_mate_position = 
            // find me someone better than me
            potential_mates.find(m => strength_sort(self, m) >= 0)?.position ?? 
            // or just find me anyone
            potential_mates[Math.floor(Math.random() * potential_mates.length)]?.position

        if (best_hunter_position && !random_walk_enabled) {
            position = best_hunter_position;
        // % chance you'll choose to mate
        } else if (best_mate_position !== undefined && Math.random() > 0.1) {
            position = best_mate_position;
        } else if (best_safe_position !== undefined && !random_walk_enabled) {
            position = best_safe_position;
        } else {
            const direction = Math.floor(Math.random() * Object.values(DIRECTION).length);
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
