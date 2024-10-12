import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import {
    initCombatantStartingPos,
    updateCombatantsPositionsAfterResize,
    MIN_HEALTH,
    killAndCopy,
    addItemToBoard,
    GetCombatant,
} from '../utils/CombatantUtils';
import { clearMapTileScorePotentials, createTileModel, TileModel, Type as TileType } from "../../models/TileModel";
import CombatantModel, { Character, DecisionType, getNewPositionFromArrowKey, State } from '../../models/CombatantModel';
import { DEFAULT, getStrengthRating, GlobalCombatantStatsModel } from '../../models/GlobalCombatantStatsModel';
import { GetItem, updateItemsAfterResize } from '../utils/ItemUtils';
import { PaintEntity } from '../slices/paintPaletteSlice';
import { Pointer } from '../../models/PointerModel';
import Maps from '../Map';
import { getCombatantAtTarget } from '../utils/TargetingUtils';
import { isValidCombatantPosition, processBoardTick } from '../utils/TurnProcessingUtils';
import { TILE_SIZE } from '../../components/Tile';
import { DASHBOARD_HEIGHT } from '../../components/Dashboard';
import Player from '../../objects/combatants/Player';
import { ItemModel, SpiderType, ItemType, Type, DEFAULT_ITEM } from '../../objects/items/Item';
import { GameState, GameMode, MovementLogic, ArrowKey } from '../utils/GameUtils';

export const PLAYER_HIGHLIGHT_COUNT: number = 6;
export const TILE_START: number = 10000;

export type Combatants = { size: number, c: { [position: number]: CombatantModel } };
export type Items = { size: number, i: { [position: number]: ItemModel[] } };
export type Tiles = {
    width: number,
    height: number,
    start: number,
    end: number,
    size: number,
    t: { [position: number]: TileModel | undefined }
};

export const GAME_DEFAULTS = {
    game_state: GameState.Title,
    game_mode: GameMode.God,
    player_highlight_count: 0,
    initial_num_combatants: 50,
    movement_logic: MovementLogic.DecisionTree,
    map: Maps['World'].name,
    use_genders: false,
    show_real_tile_images: true,
    follow_selected_combatant: false,
    tiles: { height: 30, width: 26, start: TILE_START, end: TILE_START, size: 0, t: {} },
    player: undefined,
    combatants: { size: 0, c: {} },
    items: { size: 0, i: {} },
    selected_position: undefined,
}

const SETTINGS_DEFAULTS = {
    use_genders: false,
    show_tile_potentials: false,
    geolocation: undefined,
}

interface BoardState {
    geolocation: GeolocationPosition | undefined,
    game_state: GameState,
    game_mode: GameMode,
    global_combatant_stats: GlobalCombatantStatsModel,
    view_port: {
        start: number,
        width: number,
        height: number,
        width_measurement: number,
        height_measurement: number,
    },
    initial_num_combatants: number,
    tiles: Tiles,
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
    show_real_tile_images: boolean,
    show_tile_potentials: boolean,
    use_genders: boolean,
}

function initCombatants(
    { tiles, num_combatants, init_player }:
        { tiles: Tiles, num_combatants: number, init_player: boolean }
): { player: CombatantModel | undefined, combatants: Combatants, global_combatant_stats: GlobalCombatantStatsModel } {
    const combatants: Combatants = { size: 0, c: {} };
    const global_combatant_stats = { ...DEFAULT };

    let player = undefined;
    if (init_player) {
        player = new Player({ position: 10039 },
            global_combatant_stats,
        );
    }

    for (let i = 0; i < num_combatants; i++) {
        const c_pos: number = initCombatantStartingPos({ tiles, player, combatants });
        if (c_pos < 0) {
            continue;
        }

        combatants.c[c_pos] = GetCombatant({ position: c_pos }, global_combatant_stats).toModel();
        combatants.size++;

        const c_fit = combatants.c[c_pos].fitness;
        global_combatant_stats.average_position += c_pos;
        if (global_combatant_stats.min_fitness > c_fit) {
            global_combatant_stats.min_fitness = c_fit;
        }
        global_combatant_stats.average_fitness += c_fit;
        if (global_combatant_stats.max_fitness < c_fit) {
            global_combatant_stats.max_fitness = c_fit;
        }
    }

    const real_num_combatants = combatants.size;
    global_combatant_stats.num_combatants = real_num_combatants;
    global_combatant_stats.average_position = global_combatant_stats.average_position / real_num_combatants;
    global_combatant_stats.average_fitness = global_combatant_stats.average_fitness / real_num_combatants;
    global_combatant_stats.weak_bar = (global_combatant_stats.average_fitness + global_combatant_stats.min_fitness) / 2;;
    global_combatant_stats.average_bar = (global_combatant_stats.average_fitness + global_combatant_stats.max_fitness) / 2;

    return { player: player?.toModel(), combatants, global_combatant_stats };
}

function setViewPortTileDimens(state: BoardState) {
    state.view_port.height = Math.min(state.tiles.height, Math.ceil((state.view_port.height_measurement - DASHBOARD_HEIGHT) / TILE_SIZE));
    state.view_port.width = Math.min(state.tiles.width, Math.ceil(state.view_port.width_measurement / TILE_SIZE));
}

function handleResize(args: { state: BoardState, old_window_width: number }) {
    args.state.tiles = Maps[args.state.map].generate({ width: args.state.tiles.width, height: args.state.tiles.height });
    const { combatants, deaths } = updateCombatantsPositionsAfterResize(
        {
            combatants: args.state.combatants,
            old_window_width: args.old_window_width,
            tiles: args.state.tiles,
        });
    const items = updateItemsAfterResize(
        {
            items: args.state.items,
            old_window_width: args.old_window_width,
            tiles: args.state.tiles,
        });
    args.state.combatants = combatants;
    args.state.items = items;
    args.state.global_combatant_stats.num_combatants = Object.values(combatants).length;
    args.state.global_combatant_stats.deaths += deaths;

    setViewPortTileDimens(args.state);
}

function initState(
    args?: {
        game_state?: GameState,
        game_mode?: GameMode,
        tiles?: Tiles,
        items?: Items,
        combatants?: Combatants,
        player?: CombatantModel | undefined,
        map?: string,
        initial_num_combatants?: number,
        player_highlight_count?: number,
    }, state?: BoardState & SettingsState,
): BoardState & SettingsState {
    state = state ?? {
        ...GAME_DEFAULTS,
        ...SETTINGS_DEFAULTS,
        global_combatant_stats: { ...DEFAULT },
        view_port: {
            start: TILE_START,
            width: 26,
            height: 30,
            height_measurement: 0,
            width_measurement: 0,
        },
    };

    if (args?.game_state !== undefined) {
        state.game_state = args.game_state;
    }

    if (args?.game_mode !== undefined) {
        state.game_mode = args.game_mode;
    }

    if (args?.tiles !== undefined) {
        state.tiles = args.tiles;
    }

    if (args !== undefined && Object.keys(args).includes('player')) {
        state.player = args?.player;
    }

    if (args?.combatants !== undefined) {
        state.combatants = args.combatants;
    }

    if (args?.items !== undefined) {
        state.items = args.items;
    }

    if (args?.initial_num_combatants !== undefined) {
        state.initial_num_combatants = args.initial_num_combatants;
    }

    if (args?.player_highlight_count !== undefined) {
        state.player_highlight_count = args.player_highlight_count;
    }

    if (args?.map !== undefined) {
        state.map = args.map;
    }

    setViewPortTileDimens(state);

    state.tiles = state.tiles.size !== 0 ?
        state.tiles :
        Maps[state.map].generate({ width: state.tiles.width, height: state.tiles.height });
    const { player, combatants, global_combatant_stats } =
        (state?.combatants.size !== state.initial_num_combatants) || (state.player === undefined && state.game_mode === GameMode.Adventure) ?
            initCombatants({ tiles: state.tiles, num_combatants: state.initial_num_combatants, init_player: state.game_mode === GameMode.Adventure }) :
            state;

    state.global_combatant_stats = global_combatant_stats;
    state.player = player;
    state.combatants = combatants;
    state.selected_position = undefined;

    centerViewOnPlayer(state);

    return state;
}

function spawnAt(position: number, state: BoardState & SettingsState) {
    if (isValidCombatantPosition(position, state.tiles)) {
        state.combatants.c[position] = GetCombatant({ position }, state.global_combatant_stats).toModel();
        state.combatants.size++;
        state.global_combatant_stats.num_combatants += 1;
    }
}

const mapReducers = {
    setGeoLocation: (state: BoardState & SettingsState, action: PayloadAction<GeolocationPosition>) => {
        state.geolocation = action.payload;
    },
    shrinkWidth: (state: BoardState & SettingsState) => {
        if (state.tiles.width === 0) {
            return;
        }
        const old_window_width = state.tiles.width;
        state.tiles.width -= 1
        handleResize({ state, old_window_width });
    },
    growWidth: (state: BoardState & SettingsState) => {
        const old_window_width = state.tiles.width;
        state.tiles.width += 1
        handleResize({ state, old_window_width });
    },
    shrinkHeight: (state: BoardState & SettingsState) => {
        if (state.tiles.height === 0) {
            return;
        }
        const old_window_width = state.tiles.width;
        state.tiles.height -= 1
        handleResize({ state, old_window_width });
    },
    growHeight: (state: BoardState & SettingsState) => {
        const old_window_width = state.tiles.width;
        state.tiles.height += 1
        handleResize({ state, old_window_width });
    },
    setViewPortSize: (state: BoardState & SettingsState, action: PayloadAction<{ width: number, height: number }>) => {
        state.view_port.height_measurement = action.payload.height;
        state.view_port.width_measurement = action.payload.width;
        setViewPortTileDimens(state);
    },
    setMap: (state: BoardState & SettingsState, action: PayloadAction<string>) => {
        state.map = action.payload;
        initState({ combatants: { size: 0, c: {} }, tiles: { width: state.tiles.width, height: state.tiles.height, start: TILE_START, end: TILE_START, size: 0, t: {} }, items: { size: 0, i: {} }, player: undefined }, state);
    },
    paintTile: (state: BoardState & SettingsState, action: PayloadAction<{ position: number, type: PaintEntity }>) => {
        const valid_combatant_position = isValidCombatantPosition(action.payload.position, state.tiles);
        const current_occupant = state.combatants.c[action.payload.position];
        if (Object.keys(TileType).includes(action.payload.type)) {
            state.tiles.t[action.payload.position] =
                createTileModel({ index: action.payload.position, type: action.payload.type as TileType });
            clearMapTileScorePotentials({ position: action.payload.position, tiles: state.tiles });
        } else if (!valid_combatant_position) {
            /* no op */
            return;
        } else if (Object.keys(Type).includes(action.payload.type) || Object.keys(SpiderType).includes(action.payload.type)) {
            const new_item = GetItem({ ...DEFAULT_ITEM, position: action.payload.position, type: action.payload.type as ItemType });
            addItemToBoard(new_item, state.items);
        } else if (Object.keys(Character).includes(action.payload.type)) {
            state.combatants.c[action.payload.position] =
                GetCombatant({
                    position: action.payload.position,
                    species: action.payload.type as Character,
                },
                    state.global_combatant_stats).toModel();
            if (!current_occupant) {
                state.combatants.size++;
                state.global_combatant_stats.num_combatants += 1;
            }
        }

        if (Object.keys(Pointer).includes(action.payload.type) || action.payload.type === TileType.Void) {
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
        startGame: (state) => {
            initState({
                game_state: GameState.Game,
                player: state.player,
                combatants: state.combatants,
                items: state.items,
                player_highlight_count: state.game_mode === GameMode.Adventure ? PLAYER_HIGHLIGHT_COUNT : 0,
            }, state);
        },
        stopGame: (state) => {
            initState({
                game_state: GameState.Title,
                player: state.player,
                combatants: state.combatants,
                items: state.items,
                player_highlight_count: state.game_mode === GameMode.Adventure ? PLAYER_HIGHLIGHT_COUNT : 0,
            }, state);
        },
        setGameMode: (state, action: PayloadAction<GameMode>) => {
            if (state.game_mode === action.payload) {
                return;
            }

            const args = {
                game_mode: action.payload,
                initial_num_combatants: state.initial_num_combatants,
                player_highlight_count: state.player_highlight_count,
                player: state.player,
                map: state.map,
                combatants: { size: 0, c: {} },
                tiles: { height: state.tiles.height, width: state.tiles.width, start: TILE_START, end: TILE_START, size: 0, t: {} },
                items: { size: 0, i: {} },
            };

            if (action.payload === GameMode.Adventure) {
                args.initial_num_combatants = 0;
                args.player_highlight_count = PLAYER_HIGHLIGHT_COUNT;
                args.map = Maps['Adventure'].name
                args.tiles.height = 3;
            } else {
                args.initial_num_combatants = GAME_DEFAULTS.initial_num_combatants;
                args.player_highlight_count = 0;
                args.player = undefined;
                args.map = args.map !== Maps['Adventure'].name ? args.map : Maps['World'].name
                args.tiles = GAME_DEFAULTS.tiles;
            }

            initState(args, state);
        },
        reset: (state) => {
            initState({ combatants: { size: 0, c: {} }, tiles: { width: state.tiles.width, height: state.tiles.height, start: TILE_START, end: TILE_SIZE, size: 0, t: {} }, items: { size: 0, i: {} }, player: undefined }, state);
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
                state.player.target_waypoints[0] =
                    getNewPositionFromArrowKey(state.player.position, action.payload, state.tiles.width, state.tiles.start, state.tiles.end);
            }
        },
        tick: (state) => {
            const combatant_id_to_follow = getCombatantAtTarget({ target: state.selected_position, player: state.player, combatants: state.combatants })?.id;
            const movement_result = processBoardTick({
                player: state.player,
                items: state.items,
                combatants: state.combatants,
                tiles: state.tiles,
                movement_logic: state.movement_logic,
                use_genders: state.use_genders,
                global_combatant_stats: state.global_combatant_stats
            });

            state.combatants = movement_result.combatants;
            state.items = movement_result.items;
            state.tiles = movement_result.tiles;
            state.global_combatant_stats = movement_result.global_combatant_stats;
            if (movement_result.player !== undefined) {
                state.player = movement_result.player;
            }

            setViewPortTileDimens(state);
            centerViewOnPlayer(state);

            if (!!combatant_id_to_follow) {
                // TODO: make this more efficient
                const followed = state.player?.id === combatant_id_to_follow ? state.player : Object.values(state.combatants.c).find(c => c.id === combatant_id_to_follow);
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
                } else if (action.payload.field === "decision_type" && action.payload.value === DecisionType.Seeker) {
                    selected.target_waypoints.push(selected.position);
                }
            }
        },
        killSelected: (state) => {
            if (state.selected_position !== undefined) {
                state.follow_selected_combatant = false;
                let selected = state.combatants.c[state.selected_position];
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
                        state.combatants.c[state.selected_position] = selected;
                    }
                }
            }
        },
        spawnAtSelected: (state) => {
            if (isValidCombatantPosition(state.selected_position, state.tiles)) {
                state.follow_selected_combatant = true;
                spawnAt(state.selected_position!, state);
            }
        },
        spawnAtRandom: (state) => {
            const position = initCombatantStartingPos({ tiles: state.tiles, player: GetCombatant(state.player), combatants: state.combatants });
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
            state.combatants = combatants;
            state.global_combatant_stats = global_combatant_stats;
        }
    }
})

const centerViewOnPlayer = (state: BoardState) => {
    if (state.player && state.player.position >= state.tiles.start) {
        let new_start = state.player.position;
        // snap to fit horizontal
        new_start -= Math.max(
            // check right bounds
            state.view_port.width - (state.tiles.width - (state.player.position - state.tiles.start) % state.tiles.width),
            Math.min(
                // check left bounds
                (state.player.position - state.tiles.start) % state.tiles.width,
                // everything in the middle
                Math.floor(state.view_port.width / 2),
            )
        );
        // snap to fit vertical
        new_start -= state.tiles.width *
            Math.max(
                // check bottom bounds
                Math.floor(state.view_port.height - (state.tiles.height - Math.floor((state.player.position - state.tiles.start) / state.tiles.width))),
                Math.min(
                    // check top bounds
                    Math.floor((state.player.position - state.tiles.start) / state.tiles.width),
                    // everything in the middle
                    Math.floor(state.view_port.height / 2),
                )
            );

        state.view_port.start = new_start;
    } else {
        state.view_port.start = state.tiles.start;
    };
}

export const {
    startGame,
    stopGame,
    setGameMode,
    shrinkWidth,
    setGeoLocation,
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
} = boardSlice.actions

export default boardSlice.reducer
