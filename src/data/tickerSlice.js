import { createSlice } from '@reduxjs/toolkit'

const TICK_INTERVAL = 250;

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
      if (tick_speed === 0) {
        return;
      }
      let tick_interval = TICK_INTERVAL;
      if (tick_speed < TICK_INTERVAL && tick_speed > 0) {
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
      if (tick_speed === 0) {
        return;
      }
      let tick_interval = TICK_INTERVAL;
      if (tick_speed <= TICK_INTERVAL && tick_speed > 1) {
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
    tick: (state) => {
      state.tick += 1;
    },
    reset: (state) => {
      state.tick = 0;
    }
  },
})

// Action creators are generated for each case reducer function
export const { slowDown, speedUp, pauseUnpause, tick, reset } = tickerSlice.actions

export default tickerSlice.reducer