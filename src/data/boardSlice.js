import { createSlice } from '@reduxjs/toolkit'
import { 
    initCombatantStartingPos, 
    updateCombatantsPositionsAfterResize, 
    calcMovements,
    getRandomTeam,
    updateCombatants,
} from './CombatantUtils';
import { TYPE } from "../components/Tile";

const WINDOW_WIDTH = 30;
const WINDOW_HEIGHT = 15;
const NUM_COMBATANTS = 24;

function initDefaultTiles({width, height}) {
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

function initCombatants({tiles}) {
    const combatants = {};
    const num_combatants = NUM_COMBATANTS;
    for (let i = 0; i < num_combatants; i++) {
        const c_pos = initCombatantStartingPos({tiles, combatants});
        combatants[c_pos] = {
            fitness: 0,
            team: getRandomTeam(),
            tick: 0,
        };
    }
    return combatants;
}

function initState(width, height) {
    width = width ?? WINDOW_WIDTH;
    height = height ?? WINDOW_HEIGHT;
    const tiles = initDefaultTiles({width, height});
    return {
        game_count: 1,
        width,
        height,
        tiles,
        combatants: initCombatants({tiles}),
    };
  }

export const boardSlice = createSlice({
  name: 'board',
  initialState: () => {
    return initState();
  },
  reducers: {
    shrinkWidth: (state) => {
        if (state.width === 0) {
            return;
        }
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.width -= 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        state.combatants = updateCombatantsPositionsAfterResize(
            {combatants: Object.assign({}, state.combatants), 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
    },
    growWidth: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.width += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        state.combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
    },
    shrinkHeight: (state) => {
        if (state.height === 0) {
            return;
        }
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height -= 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        state.combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        }); 
    },
    growHeight: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        state.combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
    },
    reset: (state) => {
        const new_state = initState(state.width, state.height);

        state.tiles = new_state.tiles;
        state.combatants = new_state.combatants;
        state.game_count += 1;
    },
    tick: (state) => {
        const new_combatants = calcMovements({combatants: state.combatants, window_width: state.width, tiles: state.tiles});
        updateCombatants({combatants: new_combatants, window_width: state.width, tiles: state.tiles});
    
        state.combatants = new_combatants;
    }
  },
})

export const { shrinkWidth, growWidth, shrinkHeight, growHeight, reset, tick } = boardSlice.actions

export default boardSlice.reducer