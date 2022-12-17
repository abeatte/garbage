import React from "react";
import '../css/Arena.css';
import classNames from 'classnames';
import { connect } from 'react-redux'
import { tick, reset as resetTicker, pause, pauseUnpause, MAX_TICK_SPEED } from '../data/tickerSlice'
import { tick as combatantTick, reset as resetBoard, select, killSelected, spawnAtSelected, paintTile } from '../data/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";
import { AppDispatch, AppState } from "../data/store";
import PaintPalette from "./PaintPalette";
import { Type as TileType } from "../models/TileModel";
import Item from "./Item";
import { PaintEntity } from "../data/paintPaletteSlice";
import { Pointer } from "../models/PointerModel";
import { HudPanel, setActiveHudPanel } from "../data/hudSlice";

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
        const selected_paint = this.props.paintPalette.selected;
        const selected_position = this.props.board.selected_position;
        const tiles = [] as JSX.Element[];
        this.props.board.tiles.forEach((tile, idx) => {
            const maybe_combatant = this.props.board.combatants[idx];
            const maybe_item = this.props.board.items[idx];
            const is_selected = selected_position === idx;
            const select_args = is_selected ? undefined : {position: idx, follow_combatant: !!maybe_combatant}

            const children = []
            if (maybe_combatant) {
                children.push(
                    (<Combatant 
                        key={'combatant'}
                        draggable={Object.keys(TileType).includes(selected_paint)} 
                        species={maybe_combatant.species}
                    />)
                );
            }
            if (maybe_item) {
                children.push(
                    (<Item
                        key={'item'}
                        item={maybe_item}
                    />)
                );
            }

            tiles.push(
                <Tile 
                id={idx}
                tile={tile} 
                showPotential={this.props.board.show_tile_potentials}
                showRealTileImages={this.props.board.show_real_tile_images}
                className={classNames({"Clickable" : maybe_combatant || maybe_item})}
                onClick={() => {
                    if (selected_paint !== Pointer.Target) {
                        this.props.paintOnTile({position: idx, type: selected_paint});
                    } else {
                        this.props.clickOnTile(select_args);
                    }
                }}
                onDragEnter={() => {
                    if (Object.keys(TileType).includes(selected_paint)) {
                        this.props.paintOnTile({position: idx, type: selected_paint});
                    }
                }}
                isSelected={is_selected}
                key={`${idx}_${width}_${tile}_${maybe_combatant?.id ?? 0}_${maybe_item?.id ?? 0}`}
                >
                   {
                    children.length > 0 ? (
                        <>
                            {children}
                        </>) : undefined
                   }
                </Tile>
            );
        });

        return (
            <div className={classNames("Arena_container")}>
                <Dashboard onReset={this.props.reset} />
                <div style={{display: "flex", overflow: "scroll", border: '4px solid black'}}>
                    <div className="Arena_inner_container">
                        <div className="Arena" style={{gridTemplateColumns: `${"auto ".repeat(width)}`}}>
                            {tiles}
                        </div>
                    </div>
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
    paintOnTile: (paint_args: {position: number, type: PaintEntity}) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        reset: () => {
            dispatch(resetBoard());
            dispatch(resetTicker());
            dispatch(setActiveHudPanel(HudPanel.NONE))
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
            dispatch(setActiveHudPanel(select_args ? HudPanel.DETAILS : HudPanel.NONE));
        },
        paintOnTile: (paint_args) => {
            dispatch(paintTile(paint_args));
        }
    };
}
  
export default connect(mapStateToProps, mapDispatchToProps)(Arena);
