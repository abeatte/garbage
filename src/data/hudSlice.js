import { createSlice } from '@reduxjs/toolkit'

export const hudSlice = createSlice({
  name: 'hud',
  initialState: {
    selected: undefined,
  },
  reducers: {
    select: (state, action) => {
      if (state.selected?.id === action.payload?.id) {
        state.selected = undefined;
      } else {
        state.selected = action.payload;
      }
    },
  },
})

export const { select } = hudSlice.actions

export default hudSlice.reducer