import Bomb from "../../objects/items/Bomb";
import Item, { ItemModel, ItemType } from "../../objects/items/Item";
import MedPack from "../../objects/items/MedPack";
import PokemonBall from "../../objects/items/PokemonBall";
import Spider from "../../objects/items/Spider";
import { Items, Tiles } from "../slices/boardSlice";

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
    { items, window_width, window_height, old_window_width, tiles }:
        {
            items: Items,
            window_width: number,
            window_height: number,
            old_window_width: number,
            tiles: Tiles
        }
) {
    const new_items: Items = { size: 0, i: {} };
    // TODO: fix item logic
    // for (const p in items.i) {
    //     const position = p as unknown as number;
    //     const placed_items = items.i[position];
    //     let coord = [Math.floor(position / old_window_width), position % old_window_width];

    //     if (coord[1] < window_width && coord[0] < window_height && tiles.t[position].type !== TileType.Void) {
    //         new_items.i[position] = placed_items;
    //         new_items.size += placed_items.length;
    //     }
    // }
    return new_items;
}
