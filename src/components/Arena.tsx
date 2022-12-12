/**
 * 
 */

import React from "react";
import '../css/Arena.css';
import classNames from 'classnames';
import { connect } from 'react-redux'
import { tick, reset as resetTicker, pause, pauseUnpause, MAX_TICK_SPEED } from '../data/tickerSlice'
import { tick as combatantTick, reset as resetBoard, select, Combatants, killSelected, spawnAtSelected, paintTile } from '../data/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";
import { setIsHudActionable } from "../data/hudSlice";
import { AppDispatch, AppState } from "../data/store";
import TeamStats from "./TeamStats";
import PaintPalette from "./PaintPalette";
import { Type } from "../models/TileModel";

/**
 * ________________
 * |  0|  1|  2|  3|
 * |  4|  5| X |  7|
 * |  8|  9| 10| 11|
 * -----------------
 */
// eslint-disable-next-line
const printCombatants = (args: {tick: number, combatants: Combatants, height: number, width: number}) => { 
    const {tick, combatants, height, width} = args;
    let print = `tick: ${tick} | combatants: ${Object.keys(combatants).length}\n`;

    let bar = '-';
    for (let i = 0; i < width; i++) {
        bar += '----';
    }
    bar += '\n';

    print += bar;
    for (let i = 0; i < width * height; i++) {
        if (i % width === 0) {
            print += '|';
        }
        if (combatants[i]) {
            print += ` ${combatants[i].team.charAt(0) } |`;
        } else {
            if (i < 10) {
                print += '  ';
            } else if (i < 100) {
                print += ' ';
            }
            print += `${i}|`;
        }
        if (i % width === width - 1) {
            print += '\n';
        }
    }
    print += `${bar}\n`;

    console.log(print);
}

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

    auxFunctions = (event: KeyboardEvent) => {
        if (event.key === ' ') {
            // stops page from scrolling
            event.preventDefault();
            this.props.pauseUnpause();
        } else if (event.key === 'k' || event.key === 'K') {
            // stops page from scrolling
            event.preventDefault();
            this.props.killSelected();
        } else if (event.key === 's' || event.key === 'S') {
            // stops page from scrolling
            event.preventDefault();
            this.props.spawnAtSelected();
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.auxFunctions, false);
        const tick_interval = getTickIntervalFromTickSpeed(this.props.ticker.tick_speed);
        if (tick_interval > 0) {
            this.interval = setInterval(() => this.props.performTick(), tick_interval);
        }
    }

    componentDidUpdate(prevProps: AppState, prevState: AppState) {
        // handle tick_speed updates
        if (prevProps.ticker.tick_speed !== this.props.ticker.tick_speed) {
            const tick_interval = getTickIntervalFromTickSpeed(this.props.ticker.tick_speed);
            clearInterval(this.interval);
            if (tick_interval > 0) {
                this.interval = setInterval(() => this.props.performTick(), tick_interval);
            } 
        }

        // handle combatant updates
        if (
            Object.keys(this.props.board.combatants).length < 1 && 
            Object.keys(this.props.board.items).length < 1
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
        const width = this.props.board.width;
        const selected_paint = this.props.paintPalette.selected_paint;
        const selected_position = this.props.board.selected_position;
        const tiles = [] as JSX.Element[];
        this.props.board.tiles.forEach((tile, idx) => {
            const maybe_combatant = this.props.board.combatants[idx];
            const is_selected = selected_position === idx;
            const select_args = is_selected ? undefined : {position: idx, follow_combatant: !!maybe_combatant}
            tiles.push(
                <Tile 
                id={idx}
                tile={tile} 
                showPotential={this.props.board.show_tile_potentials}
                showRealTileImages={this.props.board.show_real_tile_images}
                className={classNames({"Clickable" : !!maybe_combatant})}
                onClick={() => {
                    if (selected_paint !== Type.Void) {
                        this.props.paintOnTile({position: idx, type: selected_paint});
                    } else {
                        this.props.clickOnTile(select_args);
                    }
                }}
                onDragEnter={() => {
                    if (selected_paint !== Type.Void) {
                        this.props.paintOnTile({position: idx, type: selected_paint});
                    }
                }}
                isSelected={is_selected}
                key={`${idx}_${width}_${tile}_${maybe_combatant?.id ?? 0}`}
                >
                    {maybe_combatant && (
                        <Combatant 
                            draggable={selected_paint !== Type.Void} 
                            team={maybe_combatant.team}
                        />
                    )}
                </Tile>
            );
        });

        // printCombatants(
        //     {
        //         tick: this.props.ticker.tick, 
        //         combatants: this.props.board.combatants, 
        //         height: this.props.board.height, 
        //         width,
        //     }
        // );

        return (
            <div className={classNames("Arena_container")}>
                <Dashboard onReset={this.props.reset} />
                <div style={{display: "flex", overflow: "scroll"}}>
                    <div className="Arena_inner_container">
                        <div className="Arena" style={{gridTemplateColumns: `${"auto ".repeat(width)}`}}>
                            {tiles}
                        </div>
                    </div>
                    <TeamStats/>
                </div>
                <PaintPalette/>
            </div>
        );
    }
}

function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
        paintPalette: state.paintPalette,
    };
}

interface DispatchProps {
    reset: () => void,
    performTick: () => void,
    pauseUnpause: () => void,
    killSelected: () => void,
    spawnAtSelected: () => void,
    pause: () => void, 
    clickOnTile: (select_args?: {}) => void,
    paintOnTile: (paint_args: {position: number, type: Type}) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        reset: () => {
            dispatch(resetBoard());
            dispatch(resetTicker());
            dispatch(setIsHudActionable(false))
        },
        performTick: () => {
            dispatch(tick());
            dispatch(combatantTick());
        },
        pause: () => dispatch(pause()),
        pauseUnpause: () => dispatch(pauseUnpause()),
        killSelected: () => dispatch(killSelected()),
        spawnAtSelected: () => dispatch(spawnAtSelected()),
        clickOnTile: (select_args) => {
            dispatch(select(select_args));
            dispatch(setIsHudActionable(true));
        },
        paintOnTile: (paint_args) => {
            dispatch(paintTile(paint_args));
        }
    };
}
  
export default connect(mapStateToProps, mapDispatchToProps)(Arena);
