import tickerReducer, {
  tick,
  reset,
  pause,
  unpause,
  pauseUnpause,
  speedChange,
  toggleMaxTickSpeed,
  DEFAULT_TICK_SPEED,
  MAX_TICK_SPEED,
} from '../../data/slices/tickerSlice';

const initialState = { tick: 0, tick_speed: MAX_TICK_SPEED, prev_tick_speed: 0 };

describe('tickerSlice', () => {
  it('has correct initial state', () => {
    expect(tickerReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('tick increments tick count', () => {
    const state = tickerReducer(initialState, tick());
    expect(state.tick).toBe(1);
  });

  it('reset sets tick to 0', () => {
    const state = tickerReducer({ ...initialState, tick: 42 }, reset());
    expect(state.tick).toBe(0);
  });

  it('pause sets tick_speed to 0 and saves prev', () => {
    const state = tickerReducer({ ...initialState, tick_speed: 800 }, pause());
    expect(state.tick_speed).toBe(0);
    expect(state.prev_tick_speed).toBe(800);
  });

  it('pause when already paused does not overwrite prev_tick_speed', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 500 }, pause());
    expect(state.prev_tick_speed).toBe(500);
  });

  it('unpause restores prev_tick_speed', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 800 }, unpause());
    expect(state.tick_speed).toBe(800);
  });

  it('unpause with no prev uses DEFAULT_TICK_SPEED', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 0 }, unpause());
    expect(state.tick_speed).toBe(DEFAULT_TICK_SPEED);
  });

  it('pauseUnpause toggles pause on', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 800, prev_tick_speed: 0 }, pauseUnpause());
    expect(state.tick_speed).toBe(0);
    expect(state.prev_tick_speed).toBe(800);
  });

  it('pauseUnpause toggles pause off', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 800 }, pauseUnpause());
    expect(state.tick_speed).toBe(800);
  });

  it('speedChange clamps to MAX_TICK_SPEED', () => {
    const state = tickerReducer(initialState, speedChange(9999));
    expect(state.tick_speed).toBe(MAX_TICK_SPEED);
  });

  it('speedChange clamps to 0', () => {
    const state = tickerReducer(initialState, speedChange(-100));
    expect(state.tick_speed).toBe(0);
  });

  it('speedChange sets valid speed', () => {
    const state = tickerReducer(initialState, speedChange(500));
    expect(state.tick_speed).toBe(500);
    expect(state.prev_tick_speed).toBe(MAX_TICK_SPEED);
  });

  it('toggleMaxTickSpeed switches from MAX to DEFAULT', () => {
    const state = tickerReducer({ ...initialState, tick_speed: MAX_TICK_SPEED }, toggleMaxTickSpeed());
    expect(state.tick_speed).toBe(DEFAULT_TICK_SPEED);
  });

  it('toggleMaxTickSpeed switches from DEFAULT to MAX', () => {
    const state = tickerReducer({ ...initialState, tick_speed: DEFAULT_TICK_SPEED }, toggleMaxTickSpeed());
    expect(state.tick_speed).toBe(MAX_TICK_SPEED);
  });
});
