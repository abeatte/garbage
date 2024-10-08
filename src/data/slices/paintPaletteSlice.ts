import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Character } from "../../models/CombatantModel";
import { Pointer } from "../../models/PointerModel";
import { Type as TileType } from "../../models/TileModel";
import { ItemType } from "../../objects/items/Item";

export type PaintEntity = PlayerUsablePaintEntities | TileType | Character;
export type PlayerUsablePaintEntities = Pointer | ItemType;

type PaintPaletteState = {
    palette_displayed: boolean,
    selected: PaintEntity,
};

const initialState: PaintPaletteState = {
    palette_displayed: false,
    selected: Pointer.Target,
};

export const paintPaletteSlice = createSlice({
    name: 'paintPalette',
    initialState,
    reducers: {
        togglePalettsDisplayed: (state) => {
            state.palette_displayed = !state.palette_displayed;
        },
        setSelectedPaint: (state, action: PayloadAction<PaintEntity>) => {
            state.selected = action.payload;
        }
    },
})

export const {
    togglePalettsDisplayed,
    setSelectedPaint,
} = paintPaletteSlice.actions

export default paintPaletteSlice.reducer;