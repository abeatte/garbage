import uuid from "react-uuid";
import { 
    MAX_YOUNGLING_TICK, 
    ClockFace,
    PosData,
    IllegalMoves,
    LegalMoves, 
} from "../data/CombatantUtils";
import { TileModel } from "./TileModel";
import { getStrengthRating, GlobalCombatantStatsModel } from "./GlobalCombatantStatsModel";
import { MovementLogic } from "../data/boardSlice";
import Brain from "./Brain";
import { NeuralNetwork } from "brain.js/dist/src";
import { Input, Output } from "../scripts/BrainTrainer";
import { uniqueNamesGenerator, Config as UniqueNamesConfig, adjectives, colors, names } from 'unique-names-generator';

export enum Strength { Weak = "Weak", Average = "Average", Strong = "Strong", Immortal = "Immortal" };
export enum State { Spawning = "spawning", Alive = "alive", Mating = "mating", Dead = "dead" };
export enum Character {Bunny = "Bunny", Turtle = "Turtle", Lizard = "Lizard", Elephant = "Elephant"};
export enum DecisionType {Lover = "Lover", Fighter = "Fighter", Neutral = "Neutral"};

export interface CombatantModel {
    id: string;
    name: string | undefined;
    state: State;
    tick: number;
    position: number;
    kills: number;
    fitness: number;
    strength: Strength;
    decision_type: DecisionType;
    immortal: boolean;
    team: keyof typeof Character;
    spawn: CombatantModel | undefined;
    children: number,
}

const uniqueNamesConfig: UniqueNamesConfig = {
    dictionaries: [colors, names, adjectives],
    separator: '|',
    style: 'capital',
    length: 3,
  };

export function getRandomCombatantName(): string {
    const nameParts = uniqueNamesGenerator(uniqueNamesConfig).split("|");
    return `${nameParts[0]} ${nameParts[1]} The ${nameParts[2]}`;
}

export function createCombatant(args: {spawn_position: number, global_combatant_stats: GlobalCombatantStatsModel}): CombatantModel {
    return {   
        id: uuid(),
        name: getRandomCombatantName(),
        state: State.Spawning, 
        kills: 0,
        fitness: 0,
        strength: getStrengthRating({global_combatant_stats: args.global_combatant_stats, fitness: 0, immortal: false}),
        decision_type: DecisionType.Neutral,
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

// Lovers do not fight;
function getBestEnemyPosition(
    {self, movement_logic, bucketed_enemy_strengths}:
    {self: CombatantModel, movement_logic: MovementLogic, bucketed_enemy_strengths: {[key: string]: number[]}}): number 
{
    // position based on best prey (enemy) space

    if (movement_logic === MovementLogic.DecisionTree && self.decision_type === DecisionType.Lover) {
        return -1;
    }

    const best_hunter_bucket = bucketed_enemy_strengths[Object.keys(bucketed_enemy_strengths)
        .sort((a, b) => b_vs_a_strength(a as Strength, b as Strength))
        .filter(s => b_vs_a_strength(s as Strength, self.strength as Strength) > 0)[0]];
    const best_hunter_position = best_hunter_bucket?.length > 0 ?
        best_hunter_bucket[Math.floor(Math.random() * best_hunter_bucket.length)] : -1;

    return best_hunter_position;
}

// All types like open spaces;
function getBestOpenPosition(
    {self, movement_logic, bucketed_empty_tiles}:
    {self: CombatantModel, movement_logic: MovementLogic, bucketed_empty_tiles: {[key:string]: number[]}}): number
{
    // position based on best safe space
    const best_safe_bucket = bucketed_empty_tiles[Object.keys(bucketed_empty_tiles)
        .sort((a, b) => parseInt(b) - parseInt(a))[0] as unknown as number]
    const best_safe_position = best_safe_bucket?.length > 0 ? 
    best_safe_bucket[Math.floor(Math.random() * best_safe_bucket.length)] : -1;

    return best_safe_position;
}

// Fighters do not mate; 
function getBestMatePosition(
    {self, movement_logic, bucketed_mate_strengths}:
    {self: CombatantModel, movement_logic: MovementLogic, bucketed_mate_strengths: {[key: string]: number[]}}): number
{
    // position based on best mate space

    if (movement_logic === MovementLogic.DecisionTree && self.decision_type === DecisionType.Fighter) {
        return -1;
    }

    const best_mate_bucket = bucketed_mate_strengths[Object.keys(bucketed_mate_strengths)
        .sort((a, b) => b_vs_a_strength(a as Strength, b as Strength))
        .filter(s => b_vs_a_strength(s as Strength, self.strength as Strength) >= 0)[0]];
    const best_mate_position = best_mate_bucket?.length > 0 ?
    best_mate_bucket[Math.floor(Math.random() * best_mate_bucket.length)] : -1;

    return best_mate_position;
}

export function requestMove({movement_logic, decision_type, brain, posData, current_position, tiles, window_width}:
    {
        movement_logic: MovementLogic, 
        decision_type: DecisionType,
        brain: NeuralNetwork<Input, Output>,
        posData: PosData,
        current_position: number, 
        tiles: TileModel[], 
        window_width: number,
}): number {
    const self = posData.surroundings[ClockFace.c]?.occupant as CombatantModel;

    const bucketed_enemy_strengths = {} as {[key: string]: number[]}; 
    const bucketed_mate_strengths = {} as {[key: string]: number[]};
    const bucketed_empty_tiles = {} as {[key: number]: number[]}; 

    posData.surroundings.forEach((surrounding, idx, s_arr) => {
        if (!surrounding) {
            return;
        }

        if ([ClockFace.c, ...IllegalMoves].includes(idx)) {
            // don't count yourself or diagonal positions
            return;
        }

        const occupant = surrounding.occupant;
        if (!occupant) {
            if (surrounding.tile !== undefined) {
                if (bucketed_empty_tiles[surrounding.tile.score_potential] === undefined) {
                    bucketed_empty_tiles[surrounding.tile.score_potential] = [];
                }
                bucketed_empty_tiles[surrounding.tile.score_potential].push(surrounding.position);
            }
        } else if (
            // same team
            occupant.team === self.team && 
            // not already 'engaged'
            occupant.state !== State.Mating && 
            // not too young
            occupant.tick > MAX_YOUNGLING_TICK && 
            // not on hurtful tile
            (surrounding.tile?.tile_effect ?? -1) > -1
        ) {
            const strength = occupant.strength;
            if (bucketed_mate_strengths[strength] === undefined) {
                bucketed_mate_strengths[strength] = [];
            }
            bucketed_mate_strengths[strength].push(surrounding.position);
        } else if (
            // enemy
            occupant.team !== self.team
        ) {
            const strength = occupant.strength;
            if (bucketed_enemy_strengths[strength] === undefined) {
                bucketed_enemy_strengths[strength] = [];
            }
            bucketed_enemy_strengths[strength].push(surrounding.position);
        }
    });

    let position : number;
    if (movement_logic === MovementLogic.NeuralNetwork) {
        // TODO: the Neural Network is blind to mating situations. 
        // this causes combatants to just sit in one spot when near others. 
        position = Brain.move(brain, self, posData);
    } else {
        const random_walk_enabled = movement_logic === MovementLogic.RandomWalk;

        let attepts = 3;
        do {
            // position based on best prey (enemy) space
            const best_hunter_position = getBestEnemyPosition({self, movement_logic, bucketed_enemy_strengths});

            // position based on best safe space
            const best_safe_position = getBestOpenPosition({self, movement_logic, bucketed_empty_tiles});

            // position based on best mate space
            const best_mate_position = getBestMatePosition({self, movement_logic, bucketed_mate_strengths});

            
            if (best_hunter_position !== -1 && !random_walk_enabled) {
                position = best_hunter_position;
            // % chance you'll choose to mate
            } else if (best_mate_position !== -1 && Math.random() > 0.5 && !random_walk_enabled) {
                position = best_mate_position;
            } else if (best_safe_position !== -1 && !random_walk_enabled) {
                position = best_safe_position;
            } else {
                const clockFace = LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)];
                position = getNewPositionFromClockFace(
                    current_position, 
                    clockFace, 
                    window_width, 
                    tiles.length);
            }
            attepts--;
            // avoid fire if you can
        } while (tiles[position].tile_effect < 0 && attepts > 0);
    }
    
    return position;
};

export function getNewPositionFromClockFace(current_position: number, clockFace: ClockFace, window_width: number, tile_count: number) {
    let new_position = current_position;
    switch (clockFace) {
        case ClockFace.l:
            new_position = 
                current_position % window_width > 0 ? 
                    current_position - 1 : current_position;
            break;
        case ClockFace.t:
            new_position = 
                current_position - window_width > -1 ? 
                    current_position - window_width : current_position;
            break;
        case ClockFace.r:
            new_position = 
                current_position % window_width < window_width - 1 ? 
                    current_position + 1 : current_position;
            break;
        case ClockFace.b:
            new_position = 
                current_position + window_width < tile_count ? 
                    current_position + window_width : current_position;
            break;
        case ClockFace.c:
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
