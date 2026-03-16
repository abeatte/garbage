import hudReducer, {
  setScreenSize,
  setActiveHudPanel,
  HudDisplayMode,
  HudPanel,
} from '../../data/slices/hudSlice';

const initialState = {
  screenWidth: undefined,
  screenHeight: undefined,
  isPortraitMode: undefined,
  hudDisplayMode: HudDisplayMode.SIDE_PANEL,
  activeHudPanel: HudPanel.NONE,
};

describe('hudSlice', () => {
  it('has correct initial state', () => {
    expect(hudReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('setScreenSize updates dimensions and portrait mode', () => {
    const state = hudReducer(initialState, setScreenSize({ width: 400, height: 800 }));
    expect(state.screenWidth).toBe(400);
    expect(state.screenHeight).toBe(800);
    expect(state.isPortraitMode).toBe(true);
  });

  it('setScreenSize landscape sets isPortraitMode false', () => {
    const state = hudReducer(initialState, setScreenSize({ width: 1200, height: 800 }));
    expect(state.isPortraitMode).toBe(false);
  });

  it('setActiveHudPanel NONE results in GONE display mode', () => {
    const state = hudReducer(
      { ...initialState, screenWidth: 1400 },
      setActiveHudPanel(HudPanel.NONE)
    );
    expect(state.hudDisplayMode).toBe(HudDisplayMode.GONE);
  });

  it('setActiveHudPanel DETAILS on wide screen gives SIDE_PANEL', () => {
    const state = hudReducer(
      { ...initialState, screenWidth: 1400 },
      setActiveHudPanel(HudPanel.DETAILS)
    );
    expect(state.hudDisplayMode).toBe(HudDisplayMode.SIDE_PANEL);
  });

  it('setActiveHudPanel DETAILS on narrow screen gives FULL_SCREEN', () => {
    const state = hudReducer(
      { ...initialState, screenWidth: 400 },
      setActiveHudPanel(HudPanel.DETAILS)
    );
    expect(state.hudDisplayMode).toBe(HudDisplayMode.FULL_SCREEN);
  });

  it('setScreenSize with active panel recalculates display mode', () => {
    const withPanel = hudReducer(
      { ...initialState, screenWidth: 1400, activeHudPanel: HudPanel.STATS },
      setScreenSize({ width: 400, height: 800 })
    );
    expect(withPanel.hudDisplayMode).toBe(HudDisplayMode.FULL_SCREEN);
  });
});
