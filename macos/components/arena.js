/**
 * 
 */

import React from "react";
import {
    StyleSheet,
    View,
} from 'react-native';
import Combatant from "./combatant";
import Tile from "./tile";

const COLORS = ["darkorange", "cyan", "aquamarine", "brown", "darkorchid"];
const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};

const initDefaultTiles = ({width, height}) => {
    const tiles = [width * height];
    let idx = 0;
    for (h = 0; h < height; h++) {
        for (w = 0; w < width; w++) {
            if (h == 0 || h == height-1 || w == 0 || w == width-1) {
                tiles[idx] = "fire";
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.05 ? "grass" : Math.random() < 0.1 ? "water" : "rock";
            } else {
                tiles[idx] = "sand";
            }
            idx++;
        }
    }

    return tiles;
};

const initCombatantStartingPos = ({tiles, combatants}) => {
    let starting_pos;
    for (let i = 0; i < 10 && !starting_pos; i++) {
        const potential_pos = Math.round(Math.random() * (tiles.length - 1));
        const potential_tile = tiles[potential_pos];
        if (!combatants[potential_pos] && potential_tile != "fire" && potential_tile != "water") {
            starting_pos = potential_pos;
        }
    }

    return starting_pos;
};

const getRandomColor = () => {
    return COLORS[Math.round(Math.random() * COLORS.length)];
}

/**
 * @returns fitness between 0 and 100
 */
const evalPosition = ({position, tiles, window_width}) => {
    const tr = position - window_width - 1;
    const t = position - window_width;
    const tl = position - window_width + 1
    const r= position - 1;
    const l = position + 1;
    const br = position + window_width - 1;
    const b = position + window_width;
    const bl = position + window_width + 1;

    if (tiles[c_pos] == "fire") {
        return -50;
    } else if (tiles[c_pos] == "water" || tiles[c_pos] == "sand") {
        return -5;
    } else if (tiles[c_pos] == "grass") {
        return 100;       
    } else if (
        (t > -1 && t < tiles.length && tiles[t] == "grass") ||
        (l > -1 && l < tiles.length && tiles[l] == "grass") ||
        (r > -1 && r < tiles.length && tiles[r] == "grass") ||
        (b> -1 && b < tiles.length && tiles[b] == "grass")
    ) {
        return 15;
    } else if (
        (tr > -1 && tr < tiles.length && tiles[tr] == "grass") ||
        (tl > -1 && tl < tiles.length && tiles[tl] == "grass") ||
        (br > -1 && br < tiles.length && tiles[br] == "grass") ||
        (bl > -1 && bl < tiles.length && tiles[bl] == "grass")
    ) {
        return 10;
    } else {
        return 0;
    }
};

const calcMovements = ({combatants, window_width, tiles}) => {
    const new_combatants = {};
    Object.keys(combatants).forEach((position) => {
        const dir = Math.floor(Math.random() * Object.values(DIRECTION).length)
        const combatant = combatants[position];
        const current_position = parseInt(position);
        let new_position = current_position;
        switch (dir) {
            case DIRECTION.left:
                new_position = 
                    current_position % window_width > 0 ? 
                        current_position - 1 : current_position;
                break;
            case DIRECTION.up:
                new_position = 
                    current_position - window_width > -1 ? 
                        current_position - window_width : current_position;
                break;
            case DIRECTION.right:
                new_position = 
                    current_position % window_width < window_width - 1 ? 
                        current_position + 1 : current_position;
                break;
            case DIRECTION.down:
                new_position = 
                    current_position + window_width < tiles.length ? 
                        current_position + window_width : current_position;
                break;
            case DIRECTION.none:
                // fallthrough
            default:
                new_position = current_position;
                break;            
        }
        new_combatants[new_position] = combatant;
    });

    return new_combatants;
}

// const calcFitness = ({combatants, tiles, window_height, window_width}) => {
//     Object.keys(combatants).forEach((position) => {
//         const combatant = combatants[position];
//         combatant.fitness = evalPosition({position, tiles, window_width});
//     });
// }

/**
 * ________________
 * |  0|  1|  2|  3|
 * |  4|  5| X |  7|
 * |  8|  9| 10| 11|
 * -----------------
 */
const printCombatants = ({tick, combatants, window_height, window_width}) => { 
    let print = `tick: ${tick} | combatants: ${Object.keys(combatants).length}\n`;

    let bar = '-';
    for (let i = 0; i < window_width; i++) {
        bar += '----';
    }
    bar += '\n';

    print += bar;
    for (let i = 0; i < window_width * window_height; i++) {
        if (i % window_width == 0) {
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
        if (i % window_width == window_width - 1) {
            print += '\n';
        }
    }
    print += `${bar}\n`;

    console.debug(print);
}

class Arena extends React.Component {
    constructor() {
        super();

        const tick = 0;
        const window_width = 24;
        const window_height = 12;
        const num_combatants = 12;
    
        const tiles = initDefaultTiles({width: window_width, height: window_height});
        const combatants = {};
        for (let i = 0; i < num_combatants; i++) {
            const c_pos = initCombatantStartingPos({tiles, combatants});
            combatants[c_pos] = {
                fitness: 0,
                color: getRandomColor(),
            };
        }

        this.state = {
            tick,
            window_width,
            window_height,
            tiles,
            combatants
        }
    }

    tick() {
        const combatants = this.state.combatants;
        const window_width = this.state.window_width
        const tiles = this.state.tiles;
        const tick = this.state.tick;

        const c2 = calcMovements({combatants, window_width, tiles});
        this.setState({combatants: c2, tick: tick+1});
      }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 250);
      }
    
    componentWillUnmount() {
    clearInterval(this.interval);
    }

    render() {
    const rows = [];
    let cells = [];
    this.state.tiles.forEach((tile, idx) => {
        cells.push(
            <Tile type={tile} key={idx}>
                {this.state.combatants[idx] ? (<Combatant color={this.state.combatants[idx].color}/>) : null}
            </Tile>
        );
        if (idx % this.state.window_width == this.state.window_width - 1) {
            rows.push(<View style={styles.row} key={`row-${Math.floor(idx/this.state.window_width)}`}>{cells}</View>)
            cells = [];
        }
    });

    // printCombatants(
    //     {
    //         tick: this.state.tick, 
    //         combatants: this.state.combatants, 
    //         window_height: this.state.window_height , 
    //         window_width: this.state.window_width,
    //     }
    // );

    return (
        <View style={styles.arena}>
            {rows}
        </View>
    );
    }
}

const styles = StyleSheet.create({
    arena: {
        display: "flex",
        flexDirection: "column",
    },
    row: {
        display: "flex",
        flexDirection: "row",
    }
});

export default Arena;