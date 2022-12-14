import uuid from "react-uuid";
import CombatantModel from "./CombatantModel";
import { EntityModel } from "./EntityModel";

export enum Type { Bomb = "Bomb", PokemonBall = "PokemonBall", MedPack = "MedPack", Spider = "Spider" };

export const MAX_TILE_ITEM_COUNT = 4;

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
            return 25;
        case Type.MedPack:
            return -1;
        case Type.Spider:
            return 25;
    }
}

export function createItemModel({position, type}: {position: number, type: Type}): ItemModel {
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