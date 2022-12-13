import { createSlice } from "@reduxjs/toolkit";
import { Character } from "../models/CombatantModel";
import { Type as ItemType } from "../models/ItemModel";
import { Pointer } from "../models/PointerModel";
import { Type as TileType } from "../models/TileModel";

export type PaintEntity = Pointer | TileType | ItemType | Character;

type PaintPaletteState = {
    selected: PaintEntity,
};

const initialState: PaintPaletteState = {
    selected: Pointer.Target,
};

export const paintPaletteSlice = createSlice({
    name: 'paintPalette',
    initialState,
    reducers: {
        setSelectedPaint: (state, action: {payload: PaintEntity}) => {
            state.selected = action.payload;
        }
    },
})

export const {
    setSelectedPaint,
} = paintPaletteSlice.actions

export default paintPaletteSlice.reducer;