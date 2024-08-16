import { configureStore } from '@reduxjs/toolkit';
import tickerReducer from './slices/tickerSlice';
import boardReducer from './slices/boardSlice';
import hudReducer from './slices/hudSlice';
import paintPaletteReducer from './slices/paintPaletteSlice';

const store = configureStore({
  reducer: {
    ticker: tickerReducer,
    board: boardReducer,
    hud: hudReducer,
    paintPalette: paintPaletteReducer,
  },
})

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
