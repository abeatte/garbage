import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export const TICK_SPEED_INTERVAL = 1000; // base interval in ms (slowest speed)
export const TICK_SPEED_MAX_STEPS = 10;  // number of speed steps

// Converts a step index (1 = slowest, TICK_SPEED_MAX_STEPS = fastest) to ms interval
export const tickSpeedToMs = (step: number): number =>
    TICK_SPEED_INTERVAL * Math.pow(3 / 4, step - 1);

export const tickerSlice = createSlice({
  name: 'ticker',
  initialState: {
    tick: 0,
    tick_speed: Math.ceil(TICK_SPEED_MAX_STEPS / 2), // start at middle speed
    prev_tick_speed: 0,
  },
  reducers: {
    toggleMaxTickSpeed: (state) => {
      if (state.tick_speed === TICK_SPEED_MAX_STEPS) {
        state.tick_speed = 1;
      } else {
        state.tick_speed = TICK_SPEED_MAX_STEPS;
      }
    },
    speedChange: (state, action: PayloadAction<number>) => {
      const tick_speed = state.tick_speed;
      let new_tick_speed = action.payload;
      if (new_tick_speed > TICK_SPEED_MAX_STEPS) {
        new_tick_speed = TICK_SPEED_MAX_STEPS;
      } else if (new_tick_speed < 0) {
        new_tick_speed = 0;
      }

      if (new_tick_speed !== tick_speed) {
        state.tick_speed = new_tick_speed;
        state.prev_tick_speed = tick_speed;
      }
    },
    pauseUnpause: (state) => {
      const tick_speed = state.tick_speed;
      state.tick_speed = tick_speed === 0 ? state.prev_tick_speed : 0;
      state.prev_tick_speed = tick_speed;
    },
    pause: (state) => {
      const tick_speed = state.tick_speed;
      state.tick_speed = 0;
      if (tick_speed > 0) {
        state.prev_tick_speed = tick_speed;
      }
    },
    unpause: (state) => {
      const tick_speed = state.tick_speed;
      state.tick_speed = state.prev_tick_speed > 0 ? state.prev_tick_speed : 1;
      state.prev_tick_speed = tick_speed;
    },
    tick: (state) => {
      state.tick += 1;
    },
    reset: (state) => {
      state.tick = 0;
    }
  },
});

export const {
  toggleMaxTickSpeed,
  speedChange,
  pauseUnpause,
  pause,
  unpause,
  tick,
  reset,
} = tickerSlice.actions;

export default tickerSlice.reducer;
