import tickerReducer, {
  tick,
  reset,
  pause,
  unpause,
  pauseUnpause,
  speedChange,
  toggleMaxTickSpeed,
  TICK_SPEED_MAX_STEPS,
} from '../../data/slices/tickerSlice';

const initialState = { tick: 0, tick_speed: Math.ceil(TICK_SPEED_MAX_STEPS / 2), prev_tick_speed: 0 };

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
    const state = tickerReducer({ ...initialState, tick_speed: 5 }, pause());
    expect(state.tick_speed).toBe(0);
    expect(state.prev_tick_speed).toBe(5);
  });

  it('pause when already paused does not overwrite prev_tick_speed', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 3 }, pause());
    expect(state.prev_tick_speed).toBe(3);
  });

  it('unpause restores prev_tick_speed', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 5 }, unpause());
    expect(state.tick_speed).toBe(5);
  });

  it('unpause with no prev defaults to step 1', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 0 }, unpause());
    expect(state.tick_speed).toBe(1);
  });

  it('pauseUnpause toggles pause on', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 5, prev_tick_speed: 0 }, pauseUnpause());
    expect(state.tick_speed).toBe(0);
    expect(state.prev_tick_speed).toBe(5);
  });

  it('pauseUnpause toggles pause off', () => {
    const state = tickerReducer({ tick: 0, tick_speed: 0, prev_tick_speed: 5 }, pauseUnpause());
    expect(state.tick_speed).toBe(5);
  });

  it('speedChange clamps to TICK_SPEED_MAX_STEPS', () => {
    const state = tickerReducer(initialState, speedChange(9999));
    expect(state.tick_speed).toBe(TICK_SPEED_MAX_STEPS);
  });

  it('speedChange clamps to 0', () => {
    const state = tickerReducer(initialState, speedChange(-100));
    expect(state.tick_speed).toBe(0);
  });

  it('speedChange sets valid step', () => {
    const state = tickerReducer(initialState, speedChange(3));
    expect(state.tick_speed).toBe(3);
    expect(state.prev_tick_speed).toBe(Math.ceil(TICK_SPEED_MAX_STEPS / 2));
  });

  it('toggleMaxTickSpeed switches from MAX to step 1', () => {
    const state = tickerReducer({ ...initialState, tick_speed: TICK_SPEED_MAX_STEPS }, toggleMaxTickSpeed());
    expect(state.tick_speed).toBe(1);
  });

  it('toggleMaxTickSpeed switches from step 1 to MAX', () => {
    const state = tickerReducer({ ...initialState, tick_speed: 1 }, toggleMaxTickSpeed());
    expect(state.tick_speed).toBe(TICK_SPEED_MAX_STEPS);
  });
});
