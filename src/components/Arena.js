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
const printCombatants = ({tick, combatants, window_height, window_width}) => { 
    let print = `tick: ${tick} | combatants: ${Object.keys(combatants).length}\n`;

    let bar = '-';
    for (let i = 0; i < window_width; i++) {
        bar += '----';
    }
    bar += '\n';

    print += bar;
    for (let i = 0; i < window_width * window_height; i++) {
        if (i % window_width === 0) {
            print += '|';
        }
        if (combatants[i]) {
            print += ' X |';
        } else {
            if (i < 10) {
                print += '  ';
            } else if (i < 100) {
                print += ' ';
            }
            print += `${i}|`;
        }
        if (i % window_width === window_width - 1) {
            print += '\n';
        }
    }
    print += `${bar}\n`;

    console.debug(print);
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
    const rows = [];
    let cells = [];
    this.props.board.tiles.forEach((tile, idx) => {
        cells.push(
            <Tile type={tile} key={idx}>
                {this.props.board.combatants[idx] ? (<Combatant team={this.props.board.combatants[idx].team}/>) : null}
            </Tile>
        );
        if (idx % this.props.board.width === this.props.board.width - 1) {
            rows.push(<view className={'Row'} key={`row-${Math.floor(idx/this.props.board.width)}`}>{cells}</view>)
            cells = [];
        }
    });

    // printCombatants(
    //     {
    //         tick: this.state.tick, 
    //         combatants: this.props.board.combatants, 
    //         height: this.props.board.height, 
    //         width: this.props.board.width,
    //     }
    // );

    return (
        <view>
            <Dashboard
                onReset={this.reset}
            />
            <view className={'Arena'}>
                {rows}
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
