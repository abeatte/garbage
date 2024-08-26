import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import {
    initCombatantStartingPos,
    updateCombatantsPositionsAfterResize,
    MIN_HEALTH,
    killAndCopy,
    addItemToBoard,
} from '../utils/CombatantUtils';
import { createTileModel, TileModel, Type as TileType, updateMapTileScorePotentials } from "../../models/TileModel";
import { createItemModel, ItemModel, Type as ItemType } from '../../models/ItemModel';
import CombatantModel, { Character, createCombatant, getNewPositionFromArrowKey, getRandomSpecies, State } from '../../models/CombatantModel';
import { DEFAULT, getStrengthRating, GlobalCombatantStatsModel } from '../../models/GlobalCombatantStatsModel';
import { updateItemsAfterResize } from '../utils/ItemUtils';
import { PaintEntity } from '../slices/paintPaletteSlice';
import { Pointer } from '../../models/PointerModel';
import { createSpiderModel, paintTileForSpider, Type as SpiderType } from '../../models/SpiderModel';
import Maps from '../Map';
import { getCombatantAtTarget } from '../utils/TargetingUtils';
import { processBoardTick } from '../utils/TurnProcessingUtils';
import { TILE_SIZE } from '../../components/Tile';

export enum MovementLogic { RandomWalk = "Random Walk", NeuralNetwork = "Neural Network", DecisionTree = "Decision Tree" };
export enum GameMode { Title = "Title", God = "God", Adventure = "Adventure" };
export enum ArrowKey { ARROWLEFT = "ARROWLEFT", ARROWRIGHT = "ARROWRIGHT", ARROWUP = "ARROWUP", ARROWDOWN = "ARROWDOWN" };

export const PLAYER_HIGHLIGHT_COUNT: number = 6;

export type Combatants = { [position: number]: CombatantModel };
export type Items = { [position: number]: ItemModel[] };

export const GAME_DEFAULTS = {
    game_mode: GameMode.Title,
    player_highlight_count: 0,
    game_count: 1,
    arena: {
        width: 26,
        height: 30,
    },
    initial_num_combatants: 50,
    movement_logic: MovementLogic.DecisionTree,
    map: Maps['World'].name,
    use_genders: false,
    show_settings: false,
    show_real_tile_images: true,
    follow_selected_combatant: false,
}

const SETTINGS_DEFAULTS = {
    use_genders: false,
    show_tile_potentials: false,
}

interface BoardState {
    game_mode: GameMode,
    game_count: number,
    global_combatant_stats: GlobalCombatantStatsModel,
    view_port: {
        start: number,
        width: number,
        height: number,
    },
    arena: {
        width: number,
        height: number,
    },
    initial_num_combatants: number,
    tiles: TileModel[],
    player_highlight_count: number,
    player: CombatantModel | undefined,
    combatants: Combatants,
    items: Items,
    selected_position: number | undefined,
    follow_selected_combatant: boolean,
    movement_logic: MovementLogic,
    map: string,
}

interface SettingsState {
    show_settings: boolean,
    show_real_tile_images: boolean,
    show_tile_potentials: boolean,
    use_genders: boolean,
}

function initCombatants(
    { tiles, num_combatants, init_player }:
        { tiles: TileModel[], num_combatants: number, init_player: boolean }
): { player: CombatantModel | undefined, combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel } {
    const combatants = {} as Combatants;
    const global_combatant_stats = { ...DEFAULT };

    let player = undefined;
    if (init_player) {
        player = createCombatant({
            species: getRandomSpecies(),
            spawn_position: initCombatantStartingPos({ tiles, player, combatants }),
            global_combatant_stats,
        });
        player.is_player = true;
    }

    for (let i = 0; i < num_combatants; i++) {

        const species = getRandomSpecies();

        const c_pos: number = initCombatantStartingPos({ tiles, player, combatants });
        if (c_pos < 0) {
            continue;
        }

        combatants[c_pos] = createCombatant({ species, spawn_position: c_pos, global_combatant_stats });

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

    const real_num_combatants = Object.keys(combatants).length;
    global_combatant_stats.num_combatants = real_num_combatants;
    global_combatant_stats.average_position = global_combatant_stats.average_position / real_num_combatants;
    global_combatant_stats.average_fitness = global_combatant_stats.average_fitness / real_num_combatants;
    global_combatant_stats.weak_bar = (global_combatant_stats.average_fitness + global_combatant_stats.min_fitness) / 2;;
    global_combatant_stats.average_bar = (global_combatant_stats.average_fitness + global_combatant_stats.max_fitness) / 2;

    return { player, combatants, global_combatant_stats };
}

function handleResize(
    { state, old_window_width, old_window_height }:
        { state: BoardState, old_window_width: number, old_window_height: number }
) {
    state.tiles = Maps[state.map].generate({ width: state.arena.width, height: state.arena.height });
    const { combatants, deaths } = updateCombatantsPositionsAfterResize(
        {
            combatants: state.combatants,
            window_width: state.arena.width,
            window_height: state.arena.height,
            old_window_width,
            old_window_height,
            tiles: state.tiles,
        });
    const items = updateItemsAfterResize(
        {
            items: state.items,
            window_width: state.arena.width,
            window_height: state.arena.height,
            old_window_width,
        });
    state.combatants = combatants;
    state.items = items;
    state.global_combatant_stats.num_combatants = Object.values(combatants).length;
    state.global_combatant_stats.deaths += deaths;
}

function initState(
    args?: {
        game_mode: GameMode,
        map?: string,
        arena?: {
            width: number,
            height: number,
        },
        initial_num_combatants?: number,
        use_genders?: boolean,
        show_settings?: boolean,
        show_real_tile_images?: boolean,
    }, state?: BoardState & SettingsState,
): BoardState & SettingsState {
    state = state ?? {
        ...GAME_DEFAULTS,
        ...SETTINGS_DEFAULTS,
    } as BoardState & SettingsState;

    // populate with args
    state.game_mode = args?.game_mode ?? state.game_mode;
    state.arena = args?.arena ?? state.arena;
    state.map = args?.map ?? state.map;
    state.use_genders = args?.use_genders ?? state.use_genders;
    state.show_settings = args?.show_settings ?? state.show_settings;
    state.show_real_tile_images = args?.show_real_tile_images ?? state.show_real_tile_images;

    state.initial_num_combatants = args?.game_mode === GameMode.Adventure ? 0 : state.initial_num_combatants;
    state.player_highlight_count = state.game_mode === GameMode.Adventure ? PLAYER_HIGHLIGHT_COUNT : 0;


    const tiles = Maps[state.map].generate({ width: state.arena.width, height: state.arena.height });
    const { player, combatants, global_combatant_stats } =
        initCombatants({ tiles, num_combatants: state.initial_num_combatants, init_player: state.game_mode === GameMode.Adventure });

    state.global_combatant_stats = global_combatant_stats;
    state.view_port = {
        start: 0,
        width: state.arena.width,
        height: state.arena.height,
    };
    state.tiles = tiles;
    state.player = player;
    state.combatants = combatants;
    state.items = {};
    state.selected_position = undefined;

    return state;
}

function spawnAt(position: number, state: BoardState & SettingsState) {
    state.combatants[position] = createCombatant(
        {
            spawn_position: position,
            global_combatant_stats: state.global_combatant_stats
        }
    );
    state.global_combatant_stats.num_combatants += 1;
}

const mapReducers = {
    shrinkWidth: (state: BoardState & SettingsState) => {
        if (state.arena.width === 0) {
            return;
        }
        const old_window_height = state.arena.height;
        const old_window_width = state.arena.width;
        state.arena.width -= 1
        handleResize({ state, old_window_width, old_window_height });
    },
    growWidth: (state: BoardState & SettingsState) => {
        const old_window_height = state.arena.height;
        const old_window_width = state.arena.width;
        state.arena.width += 1
        handleResize({ state, old_window_width, old_window_height });
    },
    shrinkHeight: (state: BoardState & SettingsState) => {
        if (state.arena.height === 0) {
            return;
        }
        const old_window_height = state.arena.height;
        const old_window_width = state.arena.width;
        state.arena.height -= 1
        handleResize({ state, old_window_width, old_window_height });
    },
    growHeight: (state: BoardState & SettingsState) => {
        const old_window_height = state.arena.height;
        const old_window_width = state.arena.width;
        state.arena.height += 1
        handleResize({ state, old_window_width, old_window_height });
    },
    setViewPortSize: (state: BoardState & SettingsState, action: PayloadAction<{ width: number, height: number }>) => {
        state.view_port.height = Math.min(state.arena.height, Math.floor(action.payload.height / TILE_SIZE));
        state.view_port.width = Math.min(state.arena.width, Math.floor(action.payload.width / TILE_SIZE));
    },
    setMap: (state: BoardState & SettingsState, action: PayloadAction<string>) => {
        state.map = action.payload;
        state.tiles = Maps[state.map].generate({ width: state.arena.width, height: state.arena.height });
    },
    paintTile: (state: BoardState & SettingsState, action: PayloadAction<{ position: number, type: PaintEntity }>) => {
        const current_occupant = state.combatants[action.payload.position]
        if (Object.keys(TileType).includes(action.payload.type)) {
            state.tiles[action.payload.position] =
                createTileModel({ index: action.payload.position, type: action.payload.type as TileType });
            updateMapTileScorePotentials(state.tiles, state.arena.width);
        } else if (Object.keys(ItemType).includes(action.payload.type)) {
            const new_item =
                createItemModel({ position: action.payload.position, type: action.payload.type as ItemType });
            addItemToBoard(new_item, state.items);
        } else if (Object.keys(SpiderType).includes(action.payload.type)) {
            const new_spider =
                createSpiderModel({ position: action.payload.position, type: action.payload.type as SpiderType });
            addItemToBoard(new_spider, state.items);
            paintTileForSpider(new_spider, state.tiles, true, state.arena.width);
        } else if (Object.keys(Character).includes(action.payload.type)) {
            state.combatants[action.payload.position] =
                createCombatant({
                    spawn_position: action.payload.position,
                    species: action.payload.type as Character,
                    global_combatant_stats: state.global_combatant_stats
                });
            if (!current_occupant) {
                state.global_combatant_stats.num_combatants += 1;
            }
        } else if (Object.keys(Pointer).includes(action.payload.type)) {
            if (current_occupant) {
                state.combatants = killAndCopy({ positions: [action.payload.position], combatants: state.combatants });
                state.global_combatant_stats.num_combatants -= 1;
                state.global_combatant_stats.deaths += 1;
            }
        }
    },
};

const settingsReducers = {
    toggleShowTilePotentials: (state: BoardState & SettingsState) => {
        state.show_tile_potentials = !state.show_tile_potentials;
    },
    toggleShowRealTileImages: (state: BoardState & SettingsState) => {
        state.show_real_tile_images = !state.show_real_tile_images;
    },
    toggleUseGenders: (state: BoardState & SettingsState) => {
        state.use_genders = !state.use_genders;
    },
    setShowSettings: (state: BoardState & SettingsState, action: PayloadAction<boolean>) => {
        state.show_settings = action.payload;
    },
    setMovementLogic: (state: BoardState & SettingsState, action: PayloadAction<MovementLogic>) => {
        state.movement_logic = action.payload;
    },
}

export const boardSlice = createSlice({
    name: 'board',
    initialState: () => {
        return initState();
    },
    reducers: {
        ...mapReducers,
        ...settingsReducers,
        setGameMode: (state, action: PayloadAction<GameMode>) => {
            if (state.game_mode === action.payload) {
                return;
            }
            initState({ game_mode: action.payload, }, state);
        },
        reset: (state) => {
            initState(state, state);
            state.game_count += 1;
        },
        togglePlayerHighlight: (state) => {
            if (state.player_highlight_count > 0) {
                state.player_highlight_count -= 1;
            } else {
                state.player_highlight_count = PLAYER_HIGHLIGHT_COUNT;
            }
        },
        movePlayer: (state, action: PayloadAction<ArrowKey>) => {
            if (state.player) {
                state.player.player_turn =
                    getNewPositionFromArrowKey(state.player.position, action.payload, state.arena.width, state.tiles.length);
            }
        },
        tick: (state) => {
            const combatant_id_to_follow = getCombatantAtTarget({ target: state.selected_position, player: state.player, combatants: state.combatants })?.id;
            const movement_result = processBoardTick({
                player: state.player,
                items: state.items,
                combatants: state.combatants,
                window_width: state.arena.width,
                tiles: state.tiles,
                movement_logic: state.movement_logic,
                use_genders: state.use_genders,
                global_combatant_stats: state.global_combatant_stats
            });

            state.combatants = movement_result.combatants;
            state.items = movement_result.items;
            state.tiles = movement_result.tiles;
            state.global_combatant_stats = movement_result.global_combatant_stats;

            if (state.player && state.player.position > -1) {
                let new_start = state.player.position;
                // snap to fit horizontal
                new_start -= Math.max(
                    // check right bounds
                    state.view_port.width - (state.arena.width - state.player.position % state.arena.width),
                    Math.min(
                        // check left bounds
                        state.player.position % state.arena.width,
                        // everything in the middle
                        Math.floor(state.view_port.width / 2),
                    )
                );
                // snap to fit vertical
                new_start -= state.arena.width *
                    Math.max(
                        // check bottom bounds
                        Math.floor(state.view_port.height - (state.arena.height - Math.floor(state.player.position / state.arena.width))),
                        Math.min(
                            // check top bounds
                            Math.floor(state.player.position / state.arena.width),
                            // everything in the middle
                            Math.floor(state.view_port.height / 2),
                        )
                    );

                state.view_port.start = new_start;
            }

            if (!!combatant_id_to_follow) {
                const followed = state.player?.id === combatant_id_to_follow ? state.player : Object.values(state.combatants).find(c => c.id === combatant_id_to_follow);
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
            action: PayloadAction<{ field: any, value: string | boolean | number | undefined }>
        ) => {
            const selected = getCombatantAtTarget({ target: state.selected_position, player: state.player, combatants: state.combatants });
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
        killSelected: (state) => {
            if (state.selected_position !== undefined) {
                state.follow_selected_combatant = false;
                let selected = state.combatants[state.selected_position];
                if (selected === undefined && state.selected_position === state.player?.position) {
                    selected = state.player;
                }

                if (selected) {
                    selected.immortal = false;
                    selected.strength = getStrengthRating({
                        global_combatant_stats: state.global_combatant_stats,
                        fitness: selected.fitness,
                        immortal: selected.immortal
                    })
                    selected.state = State.Dead;
                    if (selected !== state.player) {
                        // must reassign to list to get state to notice the update. 
                        state.combatants[state.selected_position] = selected;
                    }
                }
            }
        },
        spawnAtSelected: (state) => {
            if (state.selected_position !== undefined) {
                state.follow_selected_combatant = true;
                spawnAt(state.selected_position, state);
            }
        },
        spawnAtRandom: (state) => {
            const position = initCombatantStartingPos({ tiles: state.tiles, player: state.player, combatants: state.combatants });
            spawnAt(position, state);
        },
        setInitialNumCombatants: (state, action: PayloadAction<number>) => {
            action.payload = Math.min(action.payload, GAME_DEFAULTS.initial_num_combatants * 20);
            state.initial_num_combatants = action.payload;

            const { player, combatants, global_combatant_stats } = initCombatants({
                tiles: state.tiles,
                num_combatants: state.initial_num_combatants,
                init_player: state.game_mode === GameMode.Adventure,
            });
            state.player = player;
            state.selected_position = undefined;
            state.follow_selected_combatant = false;
            state.game_count += 1;
            state.combatants = combatants;
            state.global_combatant_stats = global_combatant_stats;
        }
    }
})

export const {
    setGameMode,
    shrinkWidth,
    growWidth,
    shrinkHeight,
    growHeight,
    setViewPortSize,
    reset,
    togglePlayerHighlight,
    movePlayer,
    tick,
    select,
    updateSelectedCombatant,
    paintTile,
    killSelected,
    spawnAtSelected,
    spawnAtRandom,
    toggleShowTilePotentials,
    toggleShowRealTileImages,
    setMovementLogic,
    setMap,
    toggleUseGenders,
    setInitialNumCombatants,
    setShowSettings,
} = boardSlice.actions

export default boardSlice.reducer
