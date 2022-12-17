import { createSlice } from '@reduxjs/toolkit'
import { 
    initCombatantStartingPos, 
    updateCombatantsPositionsAfterResize, 
    calculateCombatantMovements,
    updateEntities,
    MIN_HEALTH,
    killAndCopy,
} from './CombatantUtils';
import { createTileModel, TileModel, Type as TileType, updateMapTileScorePotentials } from "../models/TileModel";
import { createItemModel, ItemModel, Type as ItemType } from '../models/ItemModel';
import CombatantModel, { Character, createCombatant, Gender, getRandomGender } from '../models/CombatantModel';
import { getInitGlobalCombatantStatsModel, getStrengthRating, GlobalCombatantStatsModel } from '../models/GlobalCombatantStatsModel';
import { updateItemsAfterResize } from './ItemUtils';
import { PaintEntity } from './paintPaletteSlice';
import { Pointer } from '../models/PointerModel';

export enum MovementLogic { RandomWalk = "Random Walk", NeuralNetwork = "Neural Network", DecisionTree = "Decision Tree" }

export type Combatants = {[position: number]: CombatantModel};
export type Items = {[position: number]: ItemModel};

export const DEFAULTS = {
    window_width: 26,
    window_height: 30,
    num_combatants: 25,
    movement_logic: MovementLogic.DecisionTree,
    use_genders: false,
    show_tile_potentials: false,
}

interface BoardState {
    game_count: number,
    global_combatant_stats: GlobalCombatantStatsModel,
    width: number,
    height: number,
    initial_num_combatants: number,
    tiles: TileModel[],
    show_settings: boolean,
    show_real_tile_images: boolean,
    show_tile_potentials: boolean,
    combatants: Combatants,
    items: Items,
    selected_position: number| undefined,
    follow_selected_combatant: boolean,
    movement_logic: MovementLogic,
    use_genders: boolean,
}

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
    {tiles, num_combatants, use_genders}: 
    {tiles: TileModel[], num_combatants: number, use_genders: boolean}
): {combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel} {
    const combatants = {} as Combatants;
    const global_combatant_stats = getInitGlobalCombatantStatsModel();
    for (let i = 0; i < num_combatants; i++) {
        const c_pos: number = initCombatantStartingPos({tiles, combatants});
        if (c_pos < 0) {
            continue;
        }

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

    const real_num_combatants =  Object.keys(combatants).length;
    global_combatant_stats.num_combatants = real_num_combatants;
    global_combatant_stats.average_position = global_combatant_stats.average_position / real_num_combatants;
    global_combatant_stats.average_fitness = global_combatant_stats.average_fitness / real_num_combatants;
    global_combatant_stats.weak_bar = (global_combatant_stats.average_fitness + global_combatant_stats.min_fitness)/2;;
    global_combatant_stats.average_bar = (global_combatant_stats.average_fitness + global_combatant_stats.max_fitness)/2;

    return {combatants, global_combatant_stats};
}

function handleResize(
    {state, old_window_width, old_window_height}: 
    {state: BoardState, old_window_width: number, old_window_height: number}
) {
    state.tiles = initDefaultTiles({width: state.width, height: state.height});
    const combatants = updateCombatantsPositionsAfterResize(
        {combatants: state.combatants, 
            window_width: state.width, 
            window_height: state.height, 
            old_window_width, 
            old_window_height, 
            tiles: state.tiles,
    }); 
    const items = updateItemsAfterResize(
        {items: state.items, 
            window_width: state.width, 
            window_height: state.height, 
            old_window_width,
    });
    const new_num_combatants = Object.values(combatants).length;
    const deaths = Object.values(state.combatants).length - new_num_combatants;
    state.combatants = combatants;
    state.items = items;
    state.global_combatant_stats.num_combatants = new_num_combatants;
    state.global_combatant_stats.deaths += deaths;
}

function initState(args?: {width: number, height: number, initial_num_combatants: number, use_genders: boolean}): BoardState {
    const {width, height, initial_num_combatants, use_genders} = args ?? {width: DEFAULTS.window_width,
        height: DEFAULTS.window_height,
        use_genders: DEFAULTS.use_genders,
        initial_num_combatants: DEFAULTS.num_combatants,
    };
    const tiles = initDefaultTiles({width, height});
    const {combatants, global_combatant_stats} = 
        initCombatants({tiles, num_combatants: initial_num_combatants, use_genders});
    return {
        game_count: 1,
        global_combatant_stats, 
        width,
        height,
        initial_num_combatants,
        tiles,
        show_settings: false,
        show_real_tile_images: true,
        show_tile_potentials: DEFAULTS.show_tile_potentials,
        combatants,
        items: {},
        selected_position: undefined,
        follow_selected_combatant: false,
        movement_logic: DEFAULTS.movement_logic,
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
        handleResize({state, old_window_width, old_window_height});
    },
    growWidth: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.width += 1
        handleResize({state, old_window_width, old_window_height});
    },
    shrinkHeight: (state) => {
        if (state.height === 0) {
            return;
        }
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height -= 1
        handleResize({state, old_window_width, old_window_height});
    },
    growHeight: (state) => {
        const old_window_height = state.height;
        const old_window_width = state.width;
        state.height += 1
        handleResize({state, old_window_width, old_window_height});
    },
    reset: (state) => {
        const new_state = initState({
            width: state.width, 
            height: state.height, 
            initial_num_combatants: state.initial_num_combatants, 
            use_genders: state.use_genders
        });

        state.tiles = new_state.tiles;
        state.combatants = new_state.combatants;
        state.items = {};
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
        const movement_result = calculateCombatantMovements({
            movement_logic: state.movement_logic,
            use_genders: state.use_genders,
            combatants: state.combatants,
            global_combatant_stats: state.global_combatant_stats,
            window_width: state.width, 
            tiles: state.tiles
        });
        const old_global_combatant_stats = state.global_combatant_stats;
        old_global_combatant_stats.births += movement_result.births;
        old_global_combatant_stats.deaths += movement_result.deaths;
        
        const entity_result = updateEntities({
            combatants: movement_result.combatants, 
            items: state.items,
            global_combatant_stats: old_global_combatant_stats, 
            window_width: state.width, 
            tiles: state.tiles
        });

        state.combatants = entity_result.combatants;
        state.items = entity_result.items;
        state.global_combatant_stats = entity_result.globalCombatantStats;

        if (!!combatant_id_to_follow) {
            const followed = Object.values(state.combatants).find(c => c.id === combatant_id_to_follow);
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
        if (selected) {
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
    paintTile: (state, action: {payload: {position: number, type: PaintEntity}}) => {
        const current_occupant = state.combatants[action.payload.position]
        if (Object.keys(TileType).includes(action.payload.type)) {
            state.tiles[action.payload.position] = 
                createTileModel({index: action.payload.position, type: action.payload.type as TileType});
            updateMapTileScorePotentials(state.tiles, state.width);
        } else if (Object.keys(ItemType).includes(action.payload.type)) {
            state.items[action.payload.position] = 
                createItemModel({position: action.payload.position, type: action.payload.type as ItemType});
        } else if (Object.keys(Character).includes(action.payload.type)) {
            state.combatants[action.payload.position] = 
                createCombatant({
                    spawn_position: action.payload.position, 
                    species: action.payload.type as Character,
                    use_genders: state.use_genders, 
                    global_combatant_stats: state.global_combatant_stats
                });            
            if (!current_occupant) {
                state.global_combatant_stats.num_combatants += 1;
            }
        } else if (Object.keys(Pointer).includes(action.payload.type)) {
            if (current_occupant) {
                state.combatants = killAndCopy({positions: [action.payload.position], combatants: state.combatants});
                state.global_combatant_stats.num_combatants -= 1;
                state.global_combatant_stats.deaths += 1;
            }
        }
    },
    killSelected: (state) => {
        if (state.selected_position !== undefined) {
            state.follow_selected_combatant = false;
            const selected = state.combatants[state.selected_position];
            if (selected) {
                selected.immortal = false;
                selected.strength = getStrengthRating({
                    global_combatant_stats: state.global_combatant_stats, 
                    fitness: selected.fitness, 
                    immortal: selected.immortal
                })
                selected.fitness = MIN_HEALTH
            }
        }
    },
    spawnAtSelected: (state) => {
        if (state.selected_position !== undefined) {
            state.follow_selected_combatant = true;
            state.combatants[state.selected_position] = createCombatant(
                {
                    spawn_position: state.selected_position, 
                    use_genders: state.use_genders, 
                    global_combatant_stats: state.global_combatant_stats
                }
            );
            state.global_combatant_stats.num_combatants += 1;
        }
    },
    toggleShowTilePotentials: (state) => {
        state.show_tile_potentials = !state.show_tile_potentials;
    },
    toggleShowRealTileImages: (state) => {
        state.show_real_tile_images = !state.show_real_tile_images;
    },
    setMovementLogic: (state, action: {payload: MovementLogic}) => {
        state.movement_logic = action.payload;
    },
    toggleUseGenders: (state) => {
        state.use_genders = !state.use_genders;
        if (!state.use_genders) {
            return;
        }
        Object.keys(state.combatants).forEach(c_pos => {
            const c = state.combatants[parseInt(c_pos)];
            if (c.gender === Gender.Unknown) {
                c.gender = getRandomGender();
            }
        });
    },
    setInitialNumCombatants: (state, action: {payload: number}) => {
        action.payload = Math.min(action.payload, DEFAULTS.num_combatants * 40);
        
        state.initial_num_combatants = action.payload;

        const {combatants, global_combatant_stats} = initCombatants({
            tiles: state.tiles, 
            num_combatants: state.initial_num_combatants, 
            use_genders: state.use_genders
        });
        state.selected_position = undefined;
        state.follow_selected_combatant = false;
        state.game_count += 1;
        state.combatants = combatants;
        state.global_combatant_stats = global_combatant_stats;
    },
    setShowSettings: (state, action: {payload: boolean}) => {
        state.show_settings = action.payload;
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
    paintTile,
    killSelected,
    spawnAtSelected,
    toggleShowTilePotentials,
    toggleShowRealTileImages,
    setMovementLogic,
    toggleUseGenders,
    setInitialNumCombatants, 
    setShowSettings,
} = boardSlice.actions

export default boardSlice.reducer
