/**
 * 
 */

import React from "react";
import {
    StyleSheet,
    View,
} from 'react-native';
import Combatant, { COLORS, MIN_HEALTH } from "./combatant";
import Dashboard from "./Dashboard";
import Tile, { TYPE } from "./tile";

const TICK_INTERVAL = 250;
const WINDOW_WIDTH = 10;
const WINDOW_HEIGHT = 10;
const NUM_COMBATANTS = 12;
const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};
const MAX_YOUNGLING_TICK = 5;

const initDefaultTiles = ({width, height}) => {
    const tiles = [width * height];
    let idx = 0;
    for (h = 0; h < height; h++) {
        for (w = 0; w < width; w++) {
            if (h == 0 || h == height-1 || w == 0 || w == width-1) {
                tiles[idx] = TYPE.fire;
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.05 ? TYPE.grass : Math.random() < 0.1 ? TYPE.water : TYPE.rock;
            } else {
                tiles[idx] = TYPE.sand;
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
        if (!combatants[potential_pos] && potential_tile != TYPE.fire && potential_tile != TYPE.water) {
            starting_pos = potential_pos;
        }
    }

    return starting_pos;
};

const getRandomColor = () => {
    return COLORS[Math.round(Math.random() * (COLORS.length - 1))];
}

const getSurroundingPos = ({position, window_width, tiles, combatants}) => {
    const ret = {positions: {}, tiles: {}, combatants: {}};

    ret.positions.tr = position - window_width + 1;
    ret.positions.t = position - window_width;
    ret.positions.tl = position - window_width - 1
    ret.positions.r = position + 1;
    ret.positions.c = position;
    ret.positions.l = position - 1;
    ret.positions.br = position + window_width + 1;
    ret.positions.b = position + window_width;
    ret.positions.bl = position + window_width - 1;

    ret.tiles.tr = tiles[ret.positions.tr];
    ret.tiles.t = tiles[ret.positions.t];
    ret.tiles.tl = tiles[ret.positions.tl];
    ret.tiles.l = tiles[ret.positions.l];
    ret.tiles.c = tiles[ret.positions.c];
    ret.tiles.r = tiles[ret.positions.r];
    ret.tiles.br = tiles[ret.positions.br];
    ret.tiles.b = tiles[ret.positions.b];
    ret.tiles.bl = tiles[ret.positions.bl];

    ret.combatants.tr = combatants[ret.positions.tr];
    ret.combatants.t = combatants[ret.positions.t];
    ret.combatants.tl = combatants[ret.positions.tl];
    ret.combatants.l = combatants[ret.positions.l];
    ret.combatants.c = combatants[ret.positions.c];
    ret.combatants.r = combatants[ret.positions.r];
    ret.combatants.br = combatants[ret.positions.br];
    ret.combatants.b = combatants[ret.positions.b];
    ret.combatants.bl = combatants[ret.positions.bl];

    return ret;
};

/**
 * @returns fitness between 0 and 100
 */
const evalPosition = ({positions, combatants, tiles}) => {
    if (tiles.c == TYPE.fire) {
        // fire hurts bad
        return -50;
    } else if (tiles.c == TYPE.water) {
        // water hurts a bit
        return -5;
    } else if (tiles.c == TYPE.grass) {
        // grass is very good
        return 50;       
    } else if (
        (tiles.t == TYPE.grass) ||
        (tiles.l == TYPE.grass) ||
        (tiles.r == TYPE.grass) ||
        (tiles.b == TYPE.grass)
    ) {
        // non-diagonal next to grass is pretty good
        return 10;
    } else if (
        (tiles.tr == TYPE.grass) ||
        (tiles.tl == TYPE.grass) ||
        (tiles.br == TYPE.grass) ||
        (tiles.bl == TYPE.grass)
    ) {
        // diagonal next to grass is ok
        return 5;
    } else {
        // lame, you get nothing
        return 0;
    }
};

const processTick = ({combatants, window_width, tiles}) => {
    const new_combatants = calcMovements({combatants, window_width, tiles});
    updateCombatants({combatants: new_combatants, window_width, tiles});

    return new_combatants;
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

        const occupient = new_combatants[new_position];
        if (!evalHealth(combatant)) {
            // you die
        } else if (!occupient) {
            // space is empty; OK to move there if you are healthy enough
            new_combatants[new_position] = combatant;
        } else if(occupient.color == combatant.color) {                
            new_combatants[current_position] = combatant;
            // space is occupied by a friendly
            if (occupient.tick > MAX_YOUNGLING_TICK && combatant.tick > MAX_YOUNGLING_TICK) {
                combatant.spawning = occupient;
                occupient.spawning = combatant;
                spawnNextGen(
                    getSurroundingPos({
                        position: new_position, 
                        window_width, 
                        tiles, 
                        combatants: new_combatants
                    }), 
                    new_combatants, tiles.length);
            }
        } else {
            // space is occupied by a foe
            new_combatants[new_position] = compete(combatant, occupient)
        }
    });

    return new_combatants;
}

const spawnNextGen = ({positions, combatants, tiles}, live_combatants, arena_size) => {
    const self = combatants.c;
    const nearby_friends = [];
    const nearby_enemies = [];
    const empty_space = [];

    Object.keys(combatants).forEach(ck => {
        const c = combatants[ck];

        if (!c) {
            if (positions[ck] > -1 && positions[ck] < arena_size) {
                empty_space.push(ck)
            }
        } else if (c.color == self.color) {
            nearby_friends.push(c);
        } else {
            nearby_enemies.push(c);
        }
    });

    if (nearby_enemies.length > 1) {
        // too dangerous, nothing happens
    } else {
        // safe, let's do it!
        const spawn_pos = positions[empty_space[Math.round(Math.random() * (empty_space.length - 1))]];
        delete self.spawning.spawning;
        delete self.spawning;
        live_combatants[spawn_pos] = {
            fitness: 0,
            // too many of my kind here, let's diverge
            color: nearby_friends.length < 4 ? self.color : getRandomColor(),
            tick: 0,
        };
    }
}

/**
 * Ties go to the a_combatant (the attacker)
 * @param {*} a the attacking combatant
 * @param {*} b the defending combatant
 * @returns the fitter combatant
 */
const compete = (a, b) => {
    const a_fitness = a.fitness;
    const b_fitness = b.fitness;
    return b_fitness > a_fitness ? b: a;
}

/**
 * @param {*} c combatant
 * @returns true if combatant should live
 */
const evalHealth = (c) => {
    return c.fitness > MIN_HEALTH;
};

const updateCombatants = ({combatants, window_width, tiles}) => {
    Object.keys(combatants).forEach(position => {
        const combatant = combatants[position];
        const posData = getSurroundingPos({position, window_width, tiles, combatants});
        combatant.fitness += evalPosition(posData);
        combatant.tick +=1;
    });
}

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
        const window_width = WINDOW_WIDTH;
        const window_height = WINDOW_HEIGHT;
        const num_combatants = NUM_COMBATANTS;
    
        const tiles = initDefaultTiles({width: window_width, height: window_height});
        const combatants = {};
        for (let i = 0; i < num_combatants; i++) {
            const c_pos = initCombatantStartingPos({tiles, combatants});
            combatants[c_pos] = {
                fitness: 0,
                color: getRandomColor(),
                tick: 0,
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

        const c2 = processTick({combatants, window_width, tiles});
        this.setState({combatants: c2, tick: tick+1});

        if (Object.keys(c2).length < 1) {
            clearInterval(this.interval);
        }
      }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), TICK_INTERVAL);
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
        <>
            <View style={styles.arena}>
                {rows}
            </View>
            <Dashboard 
                combatants={this.state.combatants} 
                tiles={this.state.tiles} 
                tick={this.state.tick}
            />
        </>
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