import { createSlice } from '@reduxjs/toolkit'

const WINDOW_WIDTH = 30;
const WINDOW_HEIGHT = 15;

export const boardSlice = createSlice({
  name: 'board',
  initialState: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
  reducers: {
    shrinkWidth: (state) => {
        if (state.width === 0) {
            return;
        }
        state.width -= 1
    },
    growWidth: (state) => {
        state.width += 1
    },
    shrinkHeight: (state) => {
        if (state.height === 0) {
            return;
        }
        state.height -= 1
    },
    growHeight: (state) => {
        state.height += 1
    },
  },
})

// Action creators are generated for each case reducer function
export const { shrinkWidth, growWidth, shrinkHeight, growHeight } = boardSlice.actions

export default boardSlice.reducer