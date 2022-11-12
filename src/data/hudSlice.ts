import { createSlice } from '@reduxjs/toolkit'

const EXPANDED_MODE_ARENA_WIDTH = 785;
const EXPANDED_MODE_HUD_WIDTH = 445;

export const HUD_DISPLAY_MODE = {GONE: 0, SIDE_PANEL: 1, FULL_SCREEN: 2};

function getHudDisplayMode(screenWidth: number | undefined, isHudActionable: boolean) {
  if (screenWidth !== undefined && screenWidth <= EXPANDED_MODE_ARENA_WIDTH + EXPANDED_MODE_HUD_WIDTH) {
    return isHudActionable ? HUD_DISPLAY_MODE.FULL_SCREEN : HUD_DISPLAY_MODE.GONE;
  } else {
    return HUD_DISPLAY_MODE.SIDE_PANEL;
  }
}

export const hudSlice = createSlice({
  name: 'hud',
  initialState: {
    screenWidth: undefined,
    screenHeight: undefined,
    isPortraitMode: undefined,
    isHudActionable: false,
    hudDisplayMode: HUD_DISPLAY_MODE.SIDE_PANEL,
  } as {
    screenWidth: number | undefined,
    screenHeight: number | undefined,
    isPortraitMode: boolean | undefined,
    isHudActionable: boolean,
    // TODO: correct this type
    hudDisplayMode: number,
  },
  reducers: {
    setScreenSize: (state, action: {payload: {width: number, height: number}}) => {
      state.screenWidth = action.payload.width;
      state.screenHeight = action.payload.height;
      state.isPortraitMode = state.screenWidth < state.screenHeight;
      
      state.hudDisplayMode = 
        getHudDisplayMode(state.screenWidth, state.isHudActionable);
    },
    setIsHudActionable: (state, action) => {
      state.isHudActionable = action.payload;
      state.hudDisplayMode = 
        getHudDisplayMode(state.screenWidth, state.isHudActionable)
    }
  },
})

export const { 
  setScreenSize,
  setIsHudActionable,
} = hudSlice.actions

export default hudSlice.reducer
