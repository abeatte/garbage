import Bomb from "../../objects/items/Bomb";
import Item, { ItemModel, ItemType } from "../../objects/items/Item";
import MedPack from "../../objects/items/MedPack";
import PokemonBall from "../../objects/items/PokemonBall";
import Spider from "../../objects/items/Spider";
import { Items } from "../slices/boardSlice";

export function GetItem(model: { type: ItemType } | ItemModel): Item {
    if (Bomb.IsOf(model)) {
        return new Bomb(model);
    } else if (MedPack.IsOf(model)) {
        return new MedPack(model);
    } else if (PokemonBall.IsOf(model)) {
        return new PokemonBall(model);
    } else if (Spider.IsOf(model)) {
        return new Spider(model);
    }

    throw new Error("ItemType not implemented.")
}

export function updateItemsAfterResize(
    { items, window_width, window_height, old_window_width }:
        {
            items: Items,
            window_width: number,
            window_height: number,
            old_window_width: number,
        }
) {
    const new_items = {} as Items;

    const dif_row = window_width - old_window_width;
    Object.keys(items).forEach(k => {
        let position = k as unknown as number;
        let coord = [Math.floor(position / old_window_width), position % old_window_width];

        if (coord[1] >= window_width || coord[0] >= window_height) {
            // they fell off the world; let's try to move them up/left
            return;
        }

        if (dif_row !== 0) {
            // translate old coord to new coord
            position = coord[0] * window_width + coord[1];
        }
    })
    return new_items;
}
