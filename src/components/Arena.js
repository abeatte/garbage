/**
 * 
 */

import React from "react";
import '../css/Arena.css';
import { connect } from 'react-redux'
import { tick, reset as resetTicker } from '../data/tickerSlice'
import { tick as combatantTick, reset as resetBoard, } from '../data/boardSlice'
import Combatant from "./Combatant";
import Dashboard from "./Dashboard";
import Tile from "./Tile";

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
    }

    processTick() {
        this.props.dispatch(tick());
        this.props.dispatch(combatantTick());
      }

    componentDidMount() {
        const tick_speed = this.props.ticker.tick_speed;
        this.interval = setInterval(() => this.processTick(), tick_speed);
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
    } 

    render() {
    const width = this.props.board.width;
        let tiles = [];
        this.props.board.tiles.forEach((tile, idx) => {
            const maybe_combatant = this.props.board.combatants[idx];
            tiles.push(
                <Tile type={tile} key={`${idx}_${width}_${tile}_${maybe_combatant?.id ?? 0}`}>
                    {maybe_combatant ? (<Combatant key={maybe_combatant.id} combatant={maybe_combatant}/>) : null}
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
            <view className="Arena_outer_container">
                <Dashboard
                    onReset={this.reset}
                />
                <view className="Arena_container">
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
    };
}
  
export default connect(mapStateToProps)(Arena);
