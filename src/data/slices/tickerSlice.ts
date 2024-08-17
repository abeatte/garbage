import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export const DEFAULT_TICK_SPEED = 1000;
export const MAX_TICK_SPEED = 2000;

export const tickerSlice = createSlice({
  name: 'ticker',
  initialState: {
    tick: 0,
    tick_speed: DEFAULT_TICK_SPEED,
    prev_tick_speed: 0,
  },
  reducers: {
    speedChange: (state, action: PayloadAction<{ value: number, respectPause?: boolean }>) => {
      const tick_speed = state.tick_speed;
      let new_tick_speed = action.payload.value;
      if (new_tick_speed > MAX_TICK_SPEED) {
        new_tick_speed = MAX_TICK_SPEED;
      } else if (new_tick_speed < 0) {
        new_tick_speed = 0;
      }

      if (action.payload.respectPause && tick_speed === 0 &&
        new_tick_speed !== state.prev_tick_speed
      ) {
        state.prev_tick_speed = new_tick_speed;
      } else if (new_tick_speed !== tick_speed) {
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
      state.tick_speed =
        state.prev_tick_speed > 0 ? state.prev_tick_speed : DEFAULT_TICK_SPEED;
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
  speedChange,
  pauseUnpause,
  pause,
  unpause,
  tick,
  reset,
} = tickerSlice.actions;

export default tickerSlice.reducer;
