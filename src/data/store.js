import { configureStore } from '@reduxjs/toolkit'
import tickerReducer from './tickerSlice'
import boardReducer from './boardSlice'

export default configureStore({
  reducer: {
    ticker: tickerReducer,
    board: boardReducer,
  },
})
