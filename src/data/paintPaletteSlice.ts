import { createSlice } from "@reduxjs/toolkit";
import { Type as TileType } from "../models/TileModel";

export const paintPaletteSlice = createSlice({
    name: 'paintPalette',
    initialState: {
        selected_paint: TileType.Void,
    },
    reducers: {
        setSelectedPaint: (state, action: {payload: TileType}) => {
            state.selected_paint = action.payload;
        }
    },
})

export const {
    setSelectedPaint,
} = paintPaletteSlice.actions

export default paintPaletteSlice.reducer;