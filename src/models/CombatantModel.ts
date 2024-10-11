import { ClockFace } from "../data/utils/CombatantUtils";
import { Type as TileType } from "./TileModel";
import { uniqueNamesGenerator, Config as UniqueNamesConfig, adjectives, colors, names } from 'unique-names-generator';
import { EntityModel } from "../objects/Entity";
import { ArrowKey } from "../data/utils/GameUtils";

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
    target_waypoints: number[];
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

export function getMapTileEffect({ species, tileType }: { species: Character | undefined, tileType: TileType | undefined }): number {
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

export function getNewPositionFromArrowKey(current_position: number, arrowKey: ArrowKey, window_width: number, tile_start: number, tile_end: number) {
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
    return validateNewPositionFromClockFace(current_position, clockFace, window_width, tile_start, tile_end);
}

function validateNewPositionFromClockFace(current_position: number, clockFace: ClockFace, window_width: number, tile_start: number, tile_end: number) {
    let new_position = current_position;
    switch (clockFace) {
        case ClockFace.l:
            new_position =
                (current_position - tile_start) % window_width > 0 ?
                    current_position - 1 : current_position;
            break;
        case ClockFace.t:
            new_position =
                current_position - window_width >= tile_start ?
                    current_position - window_width : current_position;
            break;
        case ClockFace.r:
            new_position =
                (current_position - tile_start) % window_width < window_width - 1 ?
                    current_position + 1 : current_position;
            break;
        case ClockFace.b:
            new_position =
                current_position + window_width <= tile_end ?
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

export default CombatantModel;
