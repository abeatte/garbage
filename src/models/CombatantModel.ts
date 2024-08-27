import uuid from "react-uuid";
import {
    MAX_YOUNGLING_TICK,
    ClockFace,
    PosData,
    IllegalMoves,
    LegalMoves,
} from "../data/utils/CombatantUtils";
import { TileModel, Type as TileType } from "./TileModel";
import { getStrengthRating, GlobalCombatantStatsModel } from "./GlobalCombatantStatsModel";
import { ArrowKey, MovementLogic } from "../data/slices/boardSlice";
import Brain from "./Brain";
import { uniqueNamesGenerator, Config as UniqueNamesConfig, adjectives, colors, names } from 'unique-names-generator';
import { EntityModel } from "./EntityModel";

export enum Strength { Weak = "Weak", Average = "Average", Strong = "Strong", Immortal = "Immortal" };
export enum State { Alive = "alive", Mating = "mating", Dead = "dead", Captured = "Captured" };
export enum Character {
    Bunny = "Bunny",
    Turtle = "Turtle",
    Lizard = "Lizard",
    Elephant = "Elephant",
    Dog = "Dog",
    Cat = "Cat",
    Unicorn = "Unicorn",
};
export enum DecisionType {
    Fighter = "Fighter",
    Lover = "Lover",
    Neutral = "Neutral",
    Seeker = "Seeker",
    Wanderer = "Wanderer"
};
export enum Gender { Male = "Male", Female = "Female" };

export interface CombatantModel extends EntityModel {
    name: string | undefined;
    is_player: boolean;
    target_destination: number;
    state: State;
    visited_positions: { [position: number]: number };
    kills: number;
    fitness: number;
    strength: Strength;
    decision_type: DecisionType;
    immortal: boolean;
    species: Character;
    gender: Gender;
    spawn: CombatantModel | undefined;
    children: number,
}

const Brains = Brain.init();

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

export function createCombatant(
    args: { spawn_position: number, species?: Character, decision_type?: DecisionType, global_combatant_stats: GlobalCombatantStatsModel | undefined },
): CombatantModel {
    const visited_positions = {} as { [position: number]: number };
    visited_positions[args.spawn_position] = args.spawn_position;
    const decisions = Object.values(DecisionType);
    const decision_type = args.decision_type ?? decisions[Math.floor(Math.random() * decisions.length)];
    return {
        id: uuid(),
        name: getRandomCombatantName(),
        is_player: false,
        target_destination: decision_type === DecisionType.Seeker ? args.spawn_position : -1,
        state: State.Alive,
        kills: 0,
        fitness: 0,
        strength: getStrengthRating({ global_combatant_stats: args.global_combatant_stats, fitness: 0, immortal: false }),
        decision_type,
        immortal: false,
        species: args.species ?? getRandomSpecies(),
        gender: Math.random() < .5 ? Gender.Male : Gender.Female,
        tick: 0,
        position: args.spawn_position,
        visited_positions,
        spawn: undefined,
        children: 0,
    }
}

export function getMapTileEffect({ species, tileType }: { species: Character | undefined, tileType: TileType }) {
    let species_buff = 0;

    switch (species) {
        case Character.Turtle:
            if (tileType === TileType.Fire) {
                // fire hurts a bit more
                species_buff = -10;
            } else if (tileType === TileType.Water) {
                // water becomes a little positive
                species_buff = +10;
            }
            break;
        case Character.Lizard:
            if (tileType === TileType.Fire) {
                // fire hurts a bit less
                species_buff = +5;
            } else if (tileType === TileType.Sand) {
                // water becomes slightly positive
                species_buff = +5;
            }
            break;
    }

    if (tileType === TileType.Fire) {
        // fire hurts bad
        return -50 + species_buff;
    } else if (tileType === TileType.Water) {
        // water hurts a bit
        return -5 + species_buff;
    } else if (tileType === TileType.Grass) {
        // grass is very good
        return 50 + species_buff;
    } else {
        // lame, you get nothing
        return 0 + species_buff;
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

function getBestTargetPosition(
    self: CombatantModel, bucketed_target_strengths: { [key: string]: number[] }
): number {
    // position based on best prey (enemy) space
    const best_target_bucket = bucketed_target_strengths[Object.keys(bucketed_target_strengths)
        .sort((a, b) => b_vs_a_strength(a as Strength, b as Strength))
        .filter(s => b_vs_a_strength(s as Strength, self.strength as Strength) > 0)[0]];
    const best_target_position = best_target_bucket?.length > 0 ?
        best_target_bucket[Math.floor(Math.random() * best_target_bucket.length)] : -1;

    return best_target_position;
}

// All types like open spaces;
function getBestOpenPosition(
    self: CombatantModel, movement_logic: MovementLogic, bucketed_empty_tiles: { [key: string]: number[] }
): number {
    // position based on best safe space
    const best_empty_bucket = bucketed_empty_tiles[Object.keys(bucketed_empty_tiles)
        .sort((a, b) => parseInt(b) - parseInt(a))[0] as unknown as number]
    const best_safe_position = best_empty_bucket?.length > 0 ?
        best_empty_bucket[Math.floor(Math.random() * best_empty_bucket.length)] : -1;

    return best_safe_position;
}

export function requestMove({ movement_logic, posData, self, tiles, window_width }:
    {
        movement_logic: MovementLogic,
        posData: PosData,
        self: CombatantModel,
        tiles: Readonly<TileModel[]>,
        window_width: number,
    }): number {
    const bucketed_enemy_strengths = {} as { [key: string]: number[] };
    const bucketed_ally_strengths = {} as { [key: string]: number[] };
    const bucketed_mate_strengths = {} as { [key: string]: number[] };
    const bucketed_empty_tiles = {} as { [key: number]: number[] };

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
                if (bucketed_empty_tiles[surrounding.tile.score_potential[self.species]] === undefined) {
                    bucketed_empty_tiles[surrounding.tile.score_potential[self.species]] = [];
                }
                bucketed_empty_tiles[surrounding.tile.score_potential[self.species]].push(surrounding.position);
            }
        } else if (
            // same species
            occupant.species === self.species &&
            // not already 'engaged'
            occupant.state !== State.Mating &&
            // not too young
            occupant.tick > MAX_YOUNGLING_TICK &&
            // not on hurtful tile
            (getMapTileEffect({ species: self.species, tileType: surrounding.tile.type }) ?? -1) > -1
        ) {
            const strength = occupant.strength;
            if (bucketed_mate_strengths[strength] === undefined) {
                bucketed_mate_strengths[strength] = [];
            }
            bucketed_mate_strengths[strength].push(surrounding.position);
        } else if (occupant.species === self.species) {
            const strength = occupant.strength;
            if (bucketed_ally_strengths[strength] === undefined) {
                bucketed_ally_strengths[strength] = [];
            }
            bucketed_ally_strengths[strength].push(surrounding.position);
        } else if (
            // enemy
            occupant.species !== self.species
        ) {
            const strength = occupant.strength;
            if (bucketed_enemy_strengths[strength] === undefined) {
                bucketed_enemy_strengths[strength] = [];
            }
            bucketed_enemy_strengths[strength].push(surrounding.position);
        }
    });

    let position: number;
    switch (movement_logic) {
        case MovementLogic.NeuralNetwork:
            // TODO: the Neural Network is blind to mating situations. 
            // this causes combatants to just sit in one spot when near others. 
            position = Brain.move(Brains[self.species], self, posData);
            break;
        case MovementLogic.RandomWalk:
            position = getNewPositionFromClockFace(
                self.position,
                LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)],
                window_width,
                tiles.length);
            break;
        case MovementLogic.DecisionTree:

            // seekers go directly toward their target. 
            if (self.decision_type === DecisionType.Seeker) {
                if (self.target_destination === self.position) {
                    self.target_destination = Math.floor(Math.random() * (tiles.length - 1));
                }

                const col_diff =
                    (self.target_destination % window_width) -
                    (self.position % window_width);
                const row_diff =
                    Math.floor(self.target_destination / window_width) -
                    Math.floor(self.position / window_width);

                if (Math.abs(col_diff) > Math.abs(row_diff)) {
                    position = self.position + (col_diff < 0 ? -1 : 1);
                } else {
                    position = self.position + (row_diff < 0 ? - window_width : window_width);
                }

                break;
            }

            // position based on best prey (enemy) space
            let best_target_position = getBestTargetPosition(self, bucketed_enemy_strengths);

            // if a fighter has no enemy to fight then they fight an ally
            if (
                best_target_position === -1 &&
                self.decision_type === DecisionType.Fighter
            ) {
                best_target_position = getBestTargetPosition(self, bucketed_ally_strengths);
            }

            // position based on best mate space
            let best_mate_position = getBestTargetPosition(self, bucketed_mate_strengths);

            // position based on best safe space
            let best_open_position = getBestOpenPosition(self, movement_logic, bucketed_empty_tiles);

            // Wanderers are disinterested in places they have been before
            if (self.decision_type === DecisionType.Wanderer) {
                if (self.visited_positions[best_target_position] !== undefined) {
                    best_target_position = -1;
                }
                if (self.visited_positions[best_mate_position] !== undefined) {
                    best_mate_position = -1;
                }
                if (self.visited_positions[best_open_position] !== undefined) {
                    best_open_position = -1;
                }
            }

            if (best_target_position !== -1) {
                position = best_target_position;
            }

            if (
                best_mate_position !== -1 &&
                (self.decision_type === DecisionType.Lover ||
                    // % chance you'll choose to mate
                    Math.random() > 0.5)
            ) {
                position = best_mate_position;
                self.state = State.Mating;
            } else if (best_open_position !== -1) {
                position = best_open_position;
            } else {
                // when all else fails, random walk
                position = getNewPositionFromClockFace(
                    self.position,
                    LegalMoves[Math.floor(Math.random() * Object.values(LegalMoves).length)],
                    window_width,
                    tiles.length);
            };
            break;
    }

    return position;
};

export function getNewPositionFromArrowKey(current_position: number, arrowKey: ArrowKey, window_width: number, tile_count: number) {
    let clockFace;
    switch (arrowKey) {
        case ArrowKey.ARROWLEFT:
            clockFace = ClockFace.l;
            break;
        case ArrowKey.ARROWRIGHT:
            clockFace = ClockFace.r;
            break;
        case ArrowKey.ARROWUP:
            clockFace = ClockFace.t;
            break;
        case ArrowKey.ARROWDOWN:
            clockFace = ClockFace.b;
            break;
        default:
            clockFace = ClockFace.c;
    }
    return getNewPositionFromClockFace(current_position, clockFace, window_width, tile_count);
}

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

export function getRandomSpecies(): Character {
    const set = Object.keys(Character);
    return set[Math.round(Math.random() * (set.length - 1))] as Character;
}

export function getRandomDecisionType(): DecisionType {
    const set = Object.keys(DecisionType);
    return set[Math.round(Math.random() * (set.length - 1))] as DecisionType;
}

export default CombatantModel;
