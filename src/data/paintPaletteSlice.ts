import { createSlice } from "@reduxjs/toolkit";
import { Type as ItemType } from "../models/ItemModel";
import { Type as TileType } from "../models/TileModel";

type PaintPaletteState = {
    selected: TileType | ItemType,
};

const initialState: PaintPaletteState = {
    selected: TileType.Void,
};

export const paintPaletteSlice = createSlice({
    name: 'paintPalette',
    initialState,
    reducers: {
        setSelectedPaint: (state, action: {payload: TileType | ItemType}) => {
            state.selected = action.payload;
        }
    },
})

export const {
    setSelectedPaint,
} = paintPaletteSlice.actions

export default paintPaletteSlice.reducer;