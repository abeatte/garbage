import React from "react";
import '../css/Arena.css';
import classNames from 'classnames';
import { connect } from 'react-redux'
import {
    tick,
    reset as resetTicker,
    pause,
    pauseUnpause,
    MAX_TICK_SPEED
} from '../data/slices/tickerSlice'
import {
    tick as combatantTick,
    movePlayer,
    reset as resetBoard,
    select,
    killSelected,
    spawnAtSelected,
    paintTile,
    GameMode,
    ArrowKey,
    togglePlayerHighlight,
    PLAYER_HIGHLIGHT_COUNT,
    spawnAtRandom
} from '../data/slices/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";
import { AppDispatch, AppState } from "../data/store";
import PaintPalette from "./PaintPalette";
import { Type as TileType } from "../models/TileModel";
import Item from "./Item";
import { PaintEntity } from "../data/slices/paintPaletteSlice";
import { Pointer } from "../models/PointerModel";
import { HudPanel, setActiveHudPanel } from "../data/slices/hudSlice";
import { Purpose } from "../models/EntityModel";
import Analytics from "../analytics";
import { getCombatantAtTarget } from "../data/utils/TargetingUtils";
import Controls from "./Controls";
import { mapStateToProps } from "../data/utils/ReactUtils";
import { State } from "../models/CombatantModel";

const getTickIntervalFromTickSpeed = (tickSpeed: number) => {
    if (tickSpeed === 0) {
        return 0;
    } else if (tickSpeed === MAX_TICK_SPEED) {
        return 1;
    }
    return Math.abs(tickSpeed - MAX_TICK_SPEED);
}

class Arena extends React.Component<AppState & DispatchProps> {

    interval: NodeJS.Timer | undefined = undefined;
    highlightInterval: NodeJS.Timer | undefined = undefined;

    playerMovementFunction = (direction: ArrowKey): boolean => {
        if (this.props.board.player?.state !== State.Dead && this.props.board.game_mode === GameMode.Adventure) {
            this.props.movePlayer(direction);
            this.props.performTick(this.props.board.game_mode, this.props.ticker.tick);
            return true;
        }
        return false;
    }

    auxFunctions = (event: KeyboardEvent) => {
        const key = event.key.toUpperCase();
        if (key === ' ') {
            Analytics.logEvent('key_pressed: Space');
            event.preventDefault();
            this.props.pauseUnpause();
        } else if (key === 'K') {
            Analytics.logEvent('key_pressed: K');
            event.preventDefault();
            this.props.killSelected();
        } else if (key === 'S') {
            Analytics.logEvent('key_pressed: S');
            event.preventDefault();
            this.props.spawnAtSelected();
        }

        if (this.props.board.player?.state !== State.Dead && this.props.board.game_mode === GameMode.Adventure) {
            if (key === ArrowKey.ARROWLEFT ||
                key === ArrowKey.ARROWRIGHT ||
                key === ArrowKey.ARROWUP ||
                key === ArrowKey.ARROWDOWN) {
                Analytics.logEvent(`key_pressed: ${key}`);
                event.preventDefault();
                if (this.playerMovementFunction(key)) {
                    Analytics.logEvent(`key_pressed: ${key}`);
                }
            }
        }
    }

    highlightPlayerPosition(highlightCount = PLAYER_HIGHLIGHT_COUNT) {
        var i = 0;
        const change = () => {
            i++
            this.props.togglePlayerHighlight();

            if (i === highlightCount) {
                clearInterval(this.highlightInterval);
                this.highlightInterval = undefined;
            }
        }
        if (!this.highlightInterval && highlightCount > 0) {
            this.highlightInterval = setInterval(change, 300);
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.auxFunctions, false);
        const tick_interval = getTickIntervalFromTickSpeed(this.props.ticker.tick_speed);
        if (tick_interval > 0) {
            this.interval = setInterval(
                () => this.props.performTick(this.props.board.game_mode, this.props.ticker.tick), tick_interval);
        }

        this.highlightPlayerPosition(this.props.board.player_highlight_count);
    }

    componentDidUpdate(prevProps: AppState, prevState: AppState) {
        // handle tick_speed updates
        const playerJustDied = prevProps.board.player?.state !== this.props.board.player?.state;
        if (prevProps.ticker.tick_speed !== this.props.ticker.tick_speed || playerJustDied) {
            const tick_interval = getTickIntervalFromTickSpeed(this.props.ticker.tick_speed);
            clearInterval(this.interval);
            if (tick_interval > 0) {
                this.interval = setInterval(
                    () => this.props.performTick(this.props.board.game_mode, this.props.ticker.tick), tick_interval);
            }
        }

        // handle player highlight updates  
        if (prevProps.board.player_highlight_count === 0) {
            this.highlightPlayerPosition(this.props.board.player_highlight_count);
        }

        // handle combatant updates
        if (
            Object.keys(this.props.board.combatants).length < 1 &&
            Object.keys(this.props.board.items).length < 1 &&
            !this.props.board.player
        ) {
            this.props.pause();
            clearInterval(this.interval);
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        document.removeEventListener("keydown", this.auxFunctions, false);
    }

    render() {
        const view_port = this.props.board.view_port;
        const selected_paint = this.props.paintPalette.selected;
        const selected_position = this.props.board.selected_position;
        const shouldHighlightPlayer =
            this.props.board.player_highlight_count > 0 &&
            this.props.board.player_highlight_count % 2 === 0;

        const tiles = [] as JSX.Element[];
        for (let row = 0; row < view_port.height; row++) {
            for (let col = 0; col < view_port.width; col++) {
                const idx = row * this.props.board.arena.width + col + view_port.start;
                const tile = this.props.board.tiles[idx];
                const maybe_combatant = getCombatantAtTarget({ target: idx, player: this.props.board.player, combatants: this.props.board.combatants });
                const is_player_tile = maybe_combatant?.is_player;
                const maybe_items = this.props.board.items[idx];
                const is_selected = selected_position === idx;
                const select_args = is_selected ? undefined : { position: idx, follow_combatant: !!maybe_combatant }

                const maybe_combatant_view = maybe_combatant ? (<Combatant
                    key={is_player_tile ? 'player' : 'combatant'}
                    draggable={Object.keys(TileType).includes(selected_paint)}
                    species={maybe_combatant.species}
                    state={maybe_combatant.state}
                />) : undefined;
                const maybe_items_view: JSX.Element[] = [];
                const maybe_items_view_2: JSX.Element[] = [];
                maybe_items?.forEach((item, idx) => {
                    const view = (<Item
                        key={`item_${idx}`}
                        item={item}
                        purpose={Purpose.Tile}
                    />);
                    if (idx < 2) {
                        maybe_items_view.push(view);
                    } else {
                        maybe_items_view_2.push(view);
                    }
                });

                const maybe_items_container_view = maybe_items_view.length > 0 &&
                    (<div className="Items_container_container">
                        {maybe_items_view.length < 1 ? undefined : (
                            <div className="Items_container">{maybe_items_view}</div>
                        )}
                        {maybe_items_view_2.length < 1 ? undefined : (
                            <div className="Items_container">{maybe_items_view_2}</div>
                        )}
                    </div>);

                const child_view_container = (
                    <div style={{ display: "flex", width: "inherit", height: "inherit", alignItems: "flex-end" }}>
                        {maybe_combatant_view}
                        {maybe_items_container_view}
                    </div>
                );

                tiles.push(
                    <div className="Tile_container"
                        key={`${idx}_${tile}_${maybe_combatant?.id ?? 0}_${maybe_items?.length ?? 0}`}
                        onClick={() => {
                            if (selected_paint !== Pointer.Target) {
                                Analytics.logEvent('tap_on_board: Paint');
                                this.props.paintOnTile({ position: idx, type: selected_paint });
                            } else {
                                Analytics.logEvent('tap_on_board: Select');
                                this.props.clickOnTile(select_args);
                            }
                        }}
                        onDragEnter={() => {
                            Analytics.logEvent('drag_on_board');
                            if (Object.keys(TileType).includes(selected_paint)) {
                                this.props.paintOnTile({ position: idx, type: selected_paint });
                            }
                        }}>
                        <Tile
                            id={idx}
                            tile={tile}
                            showPotential={this.props.board.show_tile_potentials}
                            showRealTileImages={this.props.board.show_real_tile_images}
                            highlight={is_player_tile && shouldHighlightPlayer}
                            className={classNames({ "Clickable": maybe_combatant || (maybe_items?.length ?? 0) > 0 })}
                            isSelected={is_selected}
                        >
                            {child_view_container}
                        </Tile>
                    </div>
                );
            };
        };

        return (
            <div className={classNames("Arena_container")}>
                <Dashboard onReset={this.props.reset} />
                <div style={{ display: "flex", overflow: "scroll", border: '4px solid black' }}>
                    <div className="Arena_inner_container">
                        <div className="Arena" style={{ gridTemplateColumns: `${"auto ".repeat(view_port.width)}` }}>
                            {tiles}
                        </div>
                    </div>
                </div>
                {this.props.board.game_mode === GameMode.Adventure &&
                    <Controls paintOnTile={this.props.paintOnTile}
                        playerMovementFunction={this.playerMovementFunction}
                        playerHighlight={shouldHighlightPlayer}
                    />}
                <PaintPalette />
            </div>
        );
    }
}

interface DispatchProps {
    reset: () => void,
    performTick: (game_mode: GameMode, tick_count: number) => void,
    pauseUnpause: () => void,
    killSelected: () => void,
    spawnAtSelected: () => void,
    spawnAtRandom: () => void,
    togglePlayerHighlight: () => void,
    movePlayer: (key: ArrowKey) => void,
    pause: () => void,
    clickOnTile: (select_args?: {}) => void,
    paintOnTile: (paint_args: { position: number, type: PaintEntity }) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        reset: () => {
            dispatch(resetBoard());
            dispatch(resetTicker());
            dispatch(setActiveHudPanel(HudPanel.NONE))
        },
        performTick: (game_mode: GameMode, tick_count: number) => {
            dispatch(tick());
            dispatch(combatantTick());
            if (game_mode === GameMode.Adventure && tick_count > 0 && tick_count % 25 === 0) {
                dispatch(spawnAtRandom());
            }
        },
        pause: () => dispatch(pause()),
        pauseUnpause: () => dispatch(pauseUnpause()),
        killSelected: () => dispatch(killSelected()),
        spawnAtSelected: () => dispatch(spawnAtSelected()),
        spawnAtRandom: () => dispatch(spawnAtRandom()),
        togglePlayerHighlight: () => dispatch(togglePlayerHighlight()),
        movePlayer: (key: ArrowKey) => dispatch(movePlayer(key)),
        clickOnTile: (select_args) => {
            dispatch(select(select_args));
            dispatch(setActiveHudPanel(select_args ? HudPanel.DETAILS : HudPanel.NONE));
        },
        paintOnTile: (paint_args) => {
            dispatch(paintTile(paint_args));
        }
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Arena);
