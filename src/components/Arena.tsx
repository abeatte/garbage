/**
 * 
 */

import React from "react";
import '../css/Arena.css';
import classNames from 'classnames';
import { connect } from 'react-redux'
import { tick, reset as resetTicker, pauseUnpause } from '../data/tickerSlice'
import { tick as combatantTick, reset as resetBoard, select, Combatants } from '../data/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";
import { HudDisplayMode, setIsHudActionable } from "../data/hudSlice";
import { AppDispatch, AppState } from "../data/store";

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

class Arena extends React.Component<AppState & DispatchProps> {

    interval: NodeJS.Timer | undefined = undefined;

    spaceFunction = (event: KeyboardEvent) => {
        if (event.key === " ") {
            // stops page from scrolling
            event.preventDefault();
            this.props.pauseUnpause();
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.spaceFunction, false);
        const tick_speed = this.props.ticker.tick_speed;
        if (tick_speed > 0) {
            this.interval = setInterval(() => this.props.performTick(), tick_speed);
        }
    }

    componentDidUpdate(prevProps: AppState, prevState: AppState) {
        // handle tick_speed updates
        if (prevProps.ticker.tick_speed !== this.props.ticker.tick_speed) {
            const tick_speed = this.props.ticker.tick_speed
            clearInterval(this.interval);
            if (tick_speed > 0) {
                this.interval = setInterval(() => this.props.performTick(), tick_speed);
            } 
        }

        // handle combatant updates
        if (Object.keys(this.props.board.combatants).length < 1) {
            clearInterval(this.interval);
        }
    }
    
    componentWillUnmount() {
        clearInterval(this.interval);
        document.removeEventListener("keydown", this.spaceFunction, false);
    } 

    render() {
        const width = this.props.board.width;
        const selected_position = this.props.board.selected_position;
        let tiles = [] as JSX.Element[];
        this.props.board.tiles.forEach((tile, idx) => {
            const maybe_combatant = this.props.board.combatants[idx];
            const is_selected = selected_position === idx;
            const select_args = is_selected ? undefined : {position: idx, follow_combatant: !!maybe_combatant}
            tiles.push(
                <Tile 
                type={tile} 
                className={classNames({"Clickable" : !!maybe_combatant})}
                onClick={() => {
                    this.props.clickOnTile(select_args);
                }} 
                isSelected={is_selected}
                key={`${idx}_${width}_${tile}_${maybe_combatant?.id ?? 0}`}
                >
                    {maybe_combatant ? (<Combatant team={maybe_combatant.team}/>) : (<></>)}
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

        const isShownWithHud = this.props.hud.hudDisplayMode === HudDisplayMode.SIDE_PANEL;

        return (
            <view className={classNames({"Arena_container": true, "With_hud" : isShownWithHud})}>
                <Dashboard
                    onReset={this.props.reset}
                />
                <view className="Arena_inner_container">
                    <view className="Arena" style={{gridTemplateColumns: `${"auto ".repeat(width)}`}}>
                        {tiles}
                    </view>
                </view>
            </view>
        );
    }
}

function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
    };
}

interface DispatchProps {
    reset: () => void,
    performTick: () => void,
    pauseUnpause: () => void,
    clickOnTile: (select_args?: {}) => void,
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
        pauseUnpause: () => dispatch(pauseUnpause()),
        clickOnTile: (select_args) => {
            dispatch(select(select_args));
            dispatch(setIsHudActionable(true));
        }
    };
}
  
export default connect(mapStateToProps, mapDispatchToProps)(Arena);
