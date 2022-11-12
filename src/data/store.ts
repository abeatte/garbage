import { configureStore } from '@reduxjs/toolkit'
// @ts-ignore
import tickerReducer from './tickerSlice'
// @ts-ignore
import boardReducer from './boardSlice'
// @ts-ignore
import hudReducer from './hudSlice'

const store = configureStore({
  reducer: {
    ticker: tickerReducer,
    board: boardReducer,
    hud: hudReducer,
  },
})

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
