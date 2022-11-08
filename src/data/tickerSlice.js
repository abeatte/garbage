import { createSlice } from '@reduxjs/toolkit'

const TICK_INTERVAL = 500;
const MAX_TICK_VALUE = 2000;

export const tickerSlice = createSlice({
  name: 'ticker',
  initialState: {
    tick: 0,
    tick_speed: TICK_INTERVAL,
    prev_tick_speed: 0,
  },
  reducers: {
    slowDown: (state) => {
      let tick_speed = state.tick_speed;
      let tick_interval = TICK_INTERVAL;
      if (tick_speed === MAX_TICK_VALUE || tick_speed === 0) {
        return;
      } else if (tick_speed < TICK_INTERVAL && tick_speed > 0) {
          tick_interval = Math.ceil(tick_speed / 2);
          if (TICK_INTERVAL -  tick_speed - tick_interval < 26) {
              tick_interval = TICK_INTERVAL - tick_speed;
          }
      }
      state.prev_tick_speed = state.tick_speed;
      state.tick_speed += tick_interval;
    },
    speedUp: (state) => {
      let tick_speed = state.tick_speed;
      let tick_interval = TICK_INTERVAL;
      if (tick_speed === 1) {
        return;
      } else if (tick_speed === 0) {
        tick_interval = -MAX_TICK_VALUE;
      } else if (tick_speed <= TICK_INTERVAL && tick_speed > 1) {
        tick_interval = Math.ceil(tick_speed / 2);
      }
      state.prev_tick_speed = state.tick_speed;
      state.tick_speed -= tick_interval;
    },
    pauseUnpause: (state) => {
        const tick_speed = state.tick_speed;
        state.tick_speed = tick_speed === 0 ? state.prev_tick_speed : 0;
        state.prev_tick_speed = tick_speed;
    },
    pause: (state) => {
      state.tick_speed = 0;
    },
    tick: (state) => {
      state.tick += 1;
    },
    reset: (state) => {
      state.tick = 0;
    }
  },
})

export const { 
  slowDown, 
  speedUp, 
  pauseUnpause, 
  pause,
  tick,
  reset,
} = tickerSlice.actions

export default tickerSlice.reducer
