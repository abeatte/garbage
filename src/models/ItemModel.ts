import uuid from "react-uuid";
import CombatantModel from "./CombatantModel";
import { EntityModel } from "./EntityModel";

export enum Type { Bomb = "Bomb", PokemonBall = "PokemonBall" };

export interface ItemModel extends EntityModel {
    type: Type;
    fuse_length: number;
    kills: number;
    captured: CombatantModel[];
}

function getFuseLength(type: Type): number {
    switch (type) {
        case Type.Bomb:
            return 3;
        case Type.PokemonBall:
            return 0;
    }
}

export function createItem({position, type}: {position: number, type: Type}): ItemModel {
    return {
        id: uuid(),
        tick: 0,
        position,
        type,
        fuse_length: getFuseLength(type),
        kills: 0,
        captured: [],
    }
}