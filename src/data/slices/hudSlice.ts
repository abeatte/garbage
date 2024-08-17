import { PayloadAction, createSlice } from '@reduxjs/toolkit'

const EXPANDED_MODE_ARENA_WIDTH = 785;
const EXPANDED_MODE_HUD_WIDTH = 445;

export enum HudDisplayMode { GONE, SIDE_PANEL, FULL_SCREEN };
export enum HudPanel { NONE, STATS, DETAILS };

function getHudDisplayMode(screenWidth: number | undefined, activeHudPanel: HudPanel) {
  if (activeHudPanel === HudPanel.NONE) {
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
    hudDisplayMode: HudDisplayMode.SIDE_PANEL,
    activeHudPanel: HudPanel.NONE,
  } as {
    screenWidth: number | undefined,
    screenHeight: number | undefined,
    isPortraitMode: boolean | undefined,
    hudDisplayMode: HudDisplayMode,
    activeHudPanel: HudPanel,
  },
  reducers: {
    setScreenSize: (state, action: PayloadAction<{ width: number, height: number }>) => {
      state.screenWidth = action.payload.width;
      state.screenHeight = action.payload.height;
      state.isPortraitMode = state.screenWidth < state.screenHeight;

      state.hudDisplayMode =
        getHudDisplayMode(state.screenWidth, state.activeHudPanel);
    },
    setActiveHudPanel: (state, action) => {
      state.activeHudPanel = action.payload;
      state.hudDisplayMode =
        getHudDisplayMode(state.screenWidth, state.activeHudPanel)
    }
  },
})

export const {
  setScreenSize,
  setActiveHudPanel,
} = hudSlice.actions

export default hudSlice.reducer
