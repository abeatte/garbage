import Bomb from "../../objects/items/Bomb";
import Item, { ItemModel, ItemType } from "../../objects/items/Item";
import MedPack from "../../objects/items/MedPack";
import PokemonBall from "../../objects/items/PokemonBall";
import Spider from "../../objects/items/Spider";
import { Items, Tiles } from "../slices/boardSlice";
import { isValidCombatantPosition } from "./TurnProcessingUtils";

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
    { items, old_window_width, tiles }:
        {
            items: Items,
            old_window_width: number,
            tiles: Tiles
        }
) {
    const new_items: Items = { size: 0, i: {} };
    const dif_row = tiles.width - old_window_width;
    for (const p in items.i) {
        const old_pos = parseInt(p);
        let new_pos = parseInt(p);
        const placed_items = items.i[old_pos];
        let coord = [Math.floor((old_pos - tiles.start) / old_window_width), (old_pos - tiles.start) % old_window_width];
        if (coord[0] >= tiles.height) {
            coord[0]--;
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        } else if (coord[1] >= tiles.width) {
            coord[1]--;
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        } else if (dif_row !== 0) {
            // translate old coord to new coord
            new_pos = coord[0] * tiles.width + coord[1] + tiles.start;
        }

        if (isValidCombatantPosition(new_pos, tiles)) {
            new_items.i[new_pos] = placed_items;
            placed_items.forEach(item => item.position = new_pos);
            new_items.size += placed_items.length;
        }
    }

    return new_items;
}
