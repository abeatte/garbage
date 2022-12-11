import { createSlice } from '@reduxjs/toolkit'

const EXPANDED_MODE_ARENA_WIDTH = 785;
const EXPANDED_MODE_HUD_WIDTH = 445;

export enum HudDisplayMode {GONE, SIDE_PANEL, FULL_SCREEN}

function getHudDisplayMode(screenWidth: number | undefined, isHudActionable: boolean) {
  if (!isHudActionable) {
    return HudDisplayMode.GONE;
  } else if (screenWidth !== undefined && screenWidth <= EXPANDED_MODE_ARENA_WIDTH + EXPANDED_MODE_HUD_WIDTH) {
    return HudDisplayMode.FULL_SCREEN;
  } else {
    return HudDisplayMode.SIDE_PANEL;
  }
}

export const hudSlice = createSlice({
  name: 'hud',
  initialState: {
    screenWidth: undefined,
    screenHeight: undefined,
    isPortraitMode: undefined,
    isHudActionable: false,
    hudDisplayMode: HudDisplayMode.SIDE_PANEL,
  } as {
    screenWidth: number | undefined,
    screenHeight: number | undefined,
    isPortraitMode: boolean | undefined,
    isHudActionable: boolean,
    hudDisplayMode: HudDisplayMode,
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
