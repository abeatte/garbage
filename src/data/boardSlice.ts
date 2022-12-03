import { createSlice } from '@reduxjs/toolkit'
import { 
    initCombatantStartingPos, 
    updateCombatantsPositionsAfterResize, 
    calcMovements,
    updateCombatants,
    MIN_HEALTH,
} from './CombatantUtils';
import { createTileModel, TileModel, Type as TileType, updateMapTileScorePotentials } from "../models/TileModel";
import CombatantModel, { createCombatant } from '../models/CombatantModel';
import { getInitGlobalCombatantStatsModel, getStrengthRating, GlobalCombatantStatsModel } from '../models/GlobalCombatantStatsModel';

export const DEFAULT_WINDOW_WIDTH = 13;
export const DEFAULT_WINDOW_HEIGHT = 15;
const NUM_COMBATANTS = 24;

export enum MovementLogic { RandomWalk = "Random Walk", NeuralNetwork = "Neural Network", DecisionTree = "Decision Tree" }

export type Combatants = {[position: number]: CombatantModel};

export function initDefaultTiles({width, height}: {width: number, height: number}): TileModel[] {
    const tiles = Array(width * height) as TileModel[];
    let idx = 0;
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            if (h === 0 || h === height-1 || w === 0 || w === width-1) {
                tiles[idx] = createTileModel({index: idx, type: TileType.Fire});
            } else if (h > height/5 && h < height/5*4 && w > width/5 && w < width/5*4) {
                tiles[idx] = createTileModel({
                    index: idx, 
                    type: Math.random() < 0.1 ?
                        TileType.Grass : 
                        Math.random() < 0.1 ? 
                        TileType.Water : 
                        TileType.Rock,
                });
            } else {
                tiles[idx] = createTileModel({index: idx, type: TileType.Sand});
            }
            idx++;
        }
    }

    updateMapTileScorePotentials(tiles, width);

    return tiles;
};

function initCombatants(
    {tiles, use_genders}: 
    {tiles: TileModel[], use_genders: boolean}
): {combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel} {
    const combatants = {} as Combatants;
    const global_combatant_stats = getInitGlobalCombatantStatsModel();
    const num_combatants = NUM_COMBATANTS;
    for (let i = 0; i < num_combatants; i++) {
        const c_pos: number = initCombatantStartingPos({tiles, combatants});
        combatants[c_pos] = createCombatant({spawn_position: c_pos, use_genders, global_combatant_stats});

        const c_fit = combatants[c_pos].fitness;
        global_combatant_stats.average_position += c_pos;
        if (global_combatant_stats.min_fitness > c_fit) {
            global_combatant_stats.min_fitness = c_fit;
        }
        global_combatant_stats.average_fitness += c_fit;
        if (global_combatant_stats.max_fitness < c_fit) {
            global_combatant_stats.max_fitness = c_fit;
        }
    }

    const number_of_combatants = Object.keys(combatants).length;
    global_combatant_stats.average_position = global_combatant_stats.average_position / number_of_combatants;
    global_combatant_stats.average_fitness = global_combatant_stats.average_fitness / number_of_combatants;
    global_combatant_stats.weak_bar = (global_combatant_stats.average_fitness + global_combatant_stats.min_fitness)/2;;
    global_combatant_stats.average_bar = (global_combatant_stats.average_fitness + global_combatant_stats.max_fitness)/2;

    return {combatants, global_combatant_stats};
}

function initState(width?: number, height?: number, use_genders?: boolean): {
    game_count: number,
    global_combatant_stats: GlobalCombatantStatsModel,
    width: number,
    height: number,
    tiles: TileModel[],
    show_tile_potentials: boolean,
    combatants: Combatants,
    selected_position: number| undefined,
    follow_selected_combatant: boolean,
    movement_logic: MovementLogic,
    use_genders: boolean,
} {
    width = width ?? DEFAULT_WINDOW_WIDTH;
    height = height ?? DEFAULT_WINDOW_HEIGHT;
    use_genders = use_genders ?? false;
    const tiles = initDefaultTiles({width, height});
    const {combatants, global_combatant_stats} = initCombatants({tiles, use_genders});
    return {
        game_count: 1,
        global_combatant_stats, 
        width,
        height,
        tiles,
        show_tile_potentials: false,
        combatants,
        selected_position: undefined,
        follow_selected_combatant: false,
        movement_logic: MovementLogic.DecisionTree,
        use_genders,
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
        state.global_combatant_stats.deaths += deaths;
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
        state.global_combatant_stats.deaths += deaths;
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
        state.global_combatant_stats.deaths += deaths;
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
        state.global_combatant_stats.deaths += deaths;
    },
    reset: (state) => {
        const new_state = initState(state.width, state.height, state.use_genders);

        state.tiles = new_state.tiles;
        state.combatants = new_state.combatants;
        state.selected_position = undefined;
        state.follow_selected_combatant = false;
        state.game_count += 1;
        state.global_combatant_stats = new_state.global_combatant_stats;
    },
    tick: (state) => {
        let combatant_id_to_follow : string | undefined;
        if (state.follow_selected_combatant) {
            combatant_id_to_follow = state.combatants[state.selected_position ?? -1]?.id;
        }
        const result = calcMovements({
            movement_logic: state.movement_logic,
            use_genders: state.use_genders,
            combatants: state.combatants, 
            global_combatant_stats: state.global_combatant_stats,
            window_width: state.width, 
            tiles: state.tiles
        });
        const new_combatants = result.combatants;
        const old_global_combatant_stats = state.global_combatant_stats;
        old_global_combatant_stats.births += result.births;
        old_global_combatant_stats.deaths += result.deaths;
        
        const new_global_combatant_stats = updateCombatants({
            combatants: new_combatants, 
            global_combatant_stats: old_global_combatant_stats, 
            window_width: state.width, 
            tiles: state.tiles
        });

        state.combatants = new_combatants;
        state.global_combatant_stats = new_global_combatant_stats;

        if (!!combatant_id_to_follow) {
            const followed = Object.values(new_combatants).find(c => c.id === combatant_id_to_follow);
            if (!!followed && followed.fitness > MIN_HEALTH) {
                state.selected_position = followed.position;
            }
        }
    },
    select: (state, action) => {
        state.selected_position = action?.payload?.position;
        state.follow_selected_combatant = action?.payload?.follow_combatant ?? false;
    },
    updateSelectedCombatant: (
        state, 
        action: {payload: {field: any, value: string | boolean | number | undefined}}
    ) => {
        const selected = state.combatants[state.selected_position ?? -1];
        if (!!selected) {
            // @ts-ignore
            selected[action.payload.field] = action.payload.value;
            if (action.payload.field === "immortal") {
                selected.strength = getStrengthRating({
                    global_combatant_stats: state.global_combatant_stats, 
                    fitness: selected.fitness, 
                    immortal: selected.immortal
                })
            }
        }
    },
    updateSelectedTile: (state, action: {payload: {field: 'type', value: TileType}}) => {
        if (state.selected_position) {
            state.tiles[state.selected_position] = createTileModel({index: state.selected_position, type: action.payload.value});
            updateMapTileScorePotentials(state.tiles, state.width);
        }
    },
    killSelected: (state) => {
        if (state.selected_position) {
            state.follow_selected_combatant = false;
            const selected = state.combatants[state.selected_position];
            selected.immortal = false;
            selected.strength = getStrengthRating({
                global_combatant_stats: state.global_combatant_stats, 
                fitness: selected.fitness, 
                immortal: selected.immortal
            })
            selected.fitness = MIN_HEALTH
        }
    },
    spawnAtSelected: (state) => {
        if (state.selected_position) {
            state.follow_selected_combatant = true;
            state.combatants[state.selected_position] = createCombatant(
                {
                    spawn_position: state.selected_position, 
                    use_genders: state.use_genders, 
                    global_combatant_stats: state.global_combatant_stats
                }
            );
        }
    },
    toggleShowTilePotentials: (state) => {
        state.show_tile_potentials = !state.show_tile_potentials;
    },
    setMovementLogic: (state, action: {payload: MovementLogic}) => {
        state.movement_logic = action.payload;
    },
    setUseGenders: (state, action: {payload: boolean}) => {
        state.use_genders = action.payload;
    }
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
    toggleShowTilePotentials,
    setMovementLogic,
    setUseGenders,
} = boardSlice.actions

export default boardSlice.reducer
