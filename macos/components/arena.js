/**
 * 
 */

import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
} from 'react-native';
import Combatant from "./combatant";
import Tile from "./tile";

const COLORS = ["darkorange", "cyan", "aquamarine", "brown", "darkorchid"];
const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3};

const initDefaultTiles = ({width, height}) => {
    const tiles = [];
    let idx = 0;
    for (h = 0; h < height; h++) {
        for (w = 0; w < width; w++) {
            if (h == 0 || h == height-1 || w == 0 || w == width-1) {
                tiles[idx] = "fire";
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.05 ? "grass" : "rock";
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
        const potential_pos = Math.round(Math.random() * tiles.length);
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
 * [ 0, 1, 2, 3, | 
 * | 4, 5, 6, 7, | 
 * | 8, 9, 10, 11]
 *  
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

    if (tiles[c_pos] == "grass") {
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
    const new_combatants = [];
    Object.keys(combatants).forEach((position) => {
        const dir = Math.round(Math.random()*Object.values(DIRECTION).length);
        const combatant = combatants[position];
        let new_position = position;
        switch (dir) {
            case DIRECTION.left:
                new_position = position + 1;
                break;
            case DIRECTION.up:
                new_position = position - window_width;
                break;
            case DIRECTION.right:
                new_position = position - 1;
                break;
            case DIRECTION.down:
                new_position = position + window_width;
                break;
            default:
                new_position = position;
                break;
        }

        if (new_position > -1 && new_position < tiles.length) {
            new_combatants[new_position] = combatant;
        } else {
            new_combatants[position] = combatant;
        }
    });

    return new_combatants;
}

const calcFitness = ({combatants, tiles, window_height, window_width}) => {
    Object.keys(combatants).forEach((position) => {
        const combatant = combatants[position];
        combatant.fitness = evalPosition({position, tiles, window_width});
    });
}

class Arena extends React.Component {
    constructor() {
        super();

        const window_width = 24;
        const window_height = 12;
        const num_combatants = 12;
    
        const tiles = initDefaultTiles({width: window_width, height: window_height});
        const combatants = [];
        for (let i = 0; i < num_combatants; i++) {
            const c_pos = initCombatantStartingPos({tiles, combatants});
            combatants[c_pos] = {
                fitness: 0,
                color: getRandomColor(),
            };
        }

        this.state = {
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

        const c2 = calcMovements({combatants, window_width, tiles});
        this.setState({combatants: c2});
      }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 250);
      }
    
    componentWillUnmount() {
    clearInterval(this.interval);
    }

    render() {
    const rows = [];
    let idx = 0;
    for(let h = 0; h < this.state.window_height; h++) { 
        const cells = []
        for (let w = 0; w < this.state.window_width; w++) {
            cells.push(
                <Tile type={this.state.tiles[idx++]} key={idx}>
                    {this.state.combatants[idx] ? (<Combatant color={this.state.combatants[idx].color}/>) : null}
                </Tile>
            );
        }
        rows.push(<View style={styles.row} key={`row-${h}`}>{cells}</View>)
    }
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