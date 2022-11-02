import { createSlice } from '@reduxjs/toolkit'
import { TYPE } from "../components/Tile";

const WINDOW_WIDTH = 30;
const WINDOW_HEIGHT = 15;

const initDefaultTiles = ({width, height}) => {
    const tiles = [width * height];
    let idx = 0;
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            if (h === 0 || h === height-1 || w === 0 || w === width-1) {
                tiles[idx] = TYPE.fire;
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.1 ?
                    TYPE.grass : 
                    Math.random() < 0.1 ? 
                        TYPE.water : 
                        TYPE.rock;
            } else {
                tiles[idx] = TYPE.sand;
            }
            idx++;
        }
    }

    return tiles;
};

export const boardSlice = createSlice({
  name: 'board',
  initialState: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    tiles: initDefaultTiles({width: WINDOW_WIDTH, height: WINDOW_HEIGHT}),
  },
  reducers: {
    shrinkWidth: (state) => {
        if (state.width === 0) {
            return;
        }
        state.width -= 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
    },
    growWidth: (state) => {
        state.width += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
    },
    shrinkHeight: (state) => {
        if (state.height === 0) {
            return;
        }
        state.height -= 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
    },
    growHeight: (state) => {
        state.height += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
    },
  },
})

// Action creators are generated for each case reducer function
export const { shrinkWidth, growWidth, shrinkHeight, growHeight } = boardSlice.actions

export default boardSlice.reducer