/**
 * 
 */

import React from "react";
import '../css/Arena.css';
import classNames from 'classnames';
import { connect } from 'react-redux'
import { tick, reset as resetTicker, pauseUnpause } from '../data/tickerSlice'
import { tick as combatantTick, reset as resetBoard, select } from '../data/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";
import { HUD_DISPLAY_MODE, setIsHudActionable } from "../data/hudSlice";

/**
 * ________________
 * |  0|  1|  2|  3|
 * |  4|  5| X |  7|
 * |  8|  9| 10| 11|
 * -----------------
 */
// eslint-disable-next-line no-unused-vars
const printCombatants = ({tick, combatants, height, width}) => { 
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

class Arena extends React.Component {
    reset = () => {
        this.props.dispatch(resetBoard());
        this.props.dispatch(resetTicker());
        this.props.dispatch(setIsHudActionable(false))
    }

    processTick() {
        this.props.dispatch(tick());
        this.props.dispatch(combatantTick());
      }


    spaceFunction = (event) => {
        if (event.key === " ") {
            // stops page from scrolling
            event.preventDefault();
            this.props.dispatch(pauseUnpause());
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.spaceFunction, false);
        const tick_speed = this.props.ticker.tick_speed;
        if (tick_speed > 0) {
            this.interval = setInterval(() => this.processTick(), tick_speed);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // handle tick_speed updates
        if (prevProps.ticker.tick_speed !== this.props.ticker.tick_speed) {
            const tick_speed = this.props.ticker.tick_speed
            clearInterval(this.interval);
            if (tick_speed > 0) {
                this.interval = setInterval(() => this.processTick(), tick_speed);
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
        let tiles = [];
        this.props.board.tiles.forEach((tile, idx) => {
            const maybe_combatant = this.props.board.combatants[idx];
            const is_selected = selected_position === idx;
            const select_args = is_selected ? undefined : {position: idx, follow_combatant: !!maybe_combatant}
            tiles.push(
                <Tile 
                type={tile} 
                className={classNames({"Clickable" : !!maybe_combatant})}
                onClick={() => {
                    this.props.dispatch(select(select_args));
                    this.props.dispatch(setIsHudActionable(true));
                }} 
                isSelected={is_selected}
                key={`${idx}_${width}_${tile}_${maybe_combatant?.id ?? 0}`}
                >
                    {maybe_combatant ? (<Combatant team={maybe_combatant.team}/>) : null}
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

        const isShownWithHud = this.props.hud.hudDisplayMode === HUD_DISPLAY_MODE.SIDE_PANEL;

        return (
            <view className={classNames({"Arena_container": true, "With_hud" : isShownWithHud})}>
                <Dashboard
                    onReset={this.reset}
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

function mapStateToProps(state) {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
    };
}
  
export default connect(mapStateToProps)(Arena);
