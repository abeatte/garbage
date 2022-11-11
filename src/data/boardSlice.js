import { createSlice } from '@reduxjs/toolkit'
import { 
    initCombatantStartingPos, 
    updateCombatantsPositionsAfterResize, 
    calcMovements,
    updateCombatants,
    MIN_HEALTH,
    getSpawnAtPosition,
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
        combatants[c_pos] = getSpawnAtPosition(c_pos);
    }
    return combatants;
}

function initState(width, height) {
    width = width ?? WINDOW_WIDTH;
    height = height ?? WINDOW_HEIGHT;
    const tiles = initDefaultTiles({width, height});
    const combatants = initCombatants({tiles});
    return {
        game_count: 1,
        births: 0,
        deaths: 0,
        width,
        height,
        tiles,
        combatants,
        selected_position: undefined,
        follow_selected_combatant: false,
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
        const combatants = updateCombatantsPositionsAfterResize(
            {combatants: Object.assign({}, state.combatants), 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
        const deaths = Object.values(state.combatants).length - Object.values(combatants).length;
        state.combatants = combatants;
        state.deaths += deaths;
    },
    growWidth: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.width += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        const combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
        const deaths = Object.values(state.combatants).length - Object.values(combatants).length;
        state.combatants = combatants;
        state.deaths += deaths;
    },
    shrinkHeight: (state) => {
        if (state.height === 0) {
            return;
        }
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height -= 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        const combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        }); 
        const deaths = Object.values(state.combatants).length - Object.values(combatants).length;
        state.combatants = combatants;
        state.deaths += deaths;
    },
    growHeight: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height += 1
        state.tiles = initDefaultTiles({width: state.width, height: state.height});
        const combatants = updateCombatantsPositionsAfterResize(
            {combatants: state.combatants, 
                window_width: state.width, 
                window_height: state.height, 
                old_window_width, 
                old_window_height, 
                tiles: state.tiles,
        });
        const deaths = Object.values(state.combatants).length - Object.values(combatants).length;
        state.combatants = combatants;
        state.deaths += deaths;
    },
    reset: (state) => {
        const new_state = initState(state.width, state.height);

        state.tiles = new_state.tiles;
        state.combatants = new_state.combatants;
        state.selected_position = undefined;
        state.follow_selected_combatant = false;
        state.game_count += 1;
        state.births = 0;
        state.deaths = 0;
    },
    tick: (state) => {
        let combatant_id_to_follow;
        if (state.follow_selected_combatant) {
            combatant_id_to_follow = state.combatants[state.selected_position]?.id;
        }
        const result = calcMovements({combatants: state.combatants, window_width: state.width, tiles: state.tiles});
        const new_combatants = result.combatants;
        updateCombatants({combatants: new_combatants, window_width: state.width, tiles: state.tiles});

        state.combatants = new_combatants;
        state.births += result.births;
        state.deaths += result.deaths;
        if (!!combatant_id_to_follow) {
            const followed = Object.values(new_combatants).find(c => c.id === combatant_id_to_follow);
            if (followed.fitness > MIN_HEALTH) {
                state.selected_position = followed.position;
            }
        }
    },
    select: (state, action) => {
        state.selected_position = action?.payload?.position;
        state.follow_selected_combatant = action?.payload?.follow_combatant ?? false;
    },
    updateSelectedCombatant: (state, action) => {
        const selected = state.combatants[state.selected_position];
        if (!!selected) {
            selected[action.payload.field] = action.payload.value;
        }
    },
    updateSelectedTile: (state, action) => {
        state.tiles[state.selected_position] = action.payload.value
    },
    killSelected: (state) => {
        state.follow_selected_combatant = false;
        const selected = state.combatants[state.selected_position];
        selected.immortal = false;
        selected.fitness = MIN_HEALTH
    },
    spawnAtSelected: (state) => {
        state.follow_selected_combatant = true;
        state.combatants[state.selected_position] = getSpawnAtPosition(state.selected_position);
    },
  }
})

export const { 
    shrinkWidth, 
    growWidth, 
    shrinkHeight, 
    growHeight, 
    reset, 
    tick, 
    select, 
    updateSelectedCombatant, 
    updateSelectedTile, 
    killSelected,
    spawnAtSelected,
} = boardSlice.actions

export default boardSlice.reducer
