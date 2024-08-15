import { Items } from "./../boardSlice";

export function updateItemsAfterResize(
    {items, window_width, window_height, old_window_width}: 
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