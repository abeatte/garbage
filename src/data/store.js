import { configureStore } from '@reduxjs/toolkit'
import tickerReducer from './tickerSlice'
import boardReducer from './boardSlice'
import hudReducer from './hudSlice'

export default configureStore({
  reducer: {
    ticker: tickerReducer,
    board: boardReducer,
    hud: hudReducer,
  },
})