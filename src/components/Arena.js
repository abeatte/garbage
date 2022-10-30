/**
 * 
 */

import React from "react";
import '../css/Arena.css';
import Combatant, { COLORS, MIN_HEALTH } from "./Combatant";
import Dashboard from "./Dashboard";
import Tile, { TYPE } from "./Tile";

const TICK_INTERVAL = 250;
const WINDOW_WIDTH = 30;
const WINDOW_HEIGHT = 15;
const NUM_COMBATANTS = 24;
const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};
const MAX_YOUNGLING_TICK = 5;

const initDefaultTiles = ({width, height}) => {
    const tiles = [width * height];
    let idx = 0;
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            if (h === 0 || h === height-1 || w === 0 || w === width-1) {
                tiles[idx] = TYPE.fire;
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.1 ?
                    TYPE.grass : 
                    Math.random() < 0.1 ? 
                        TYPE.water : 
                        TYPE.rock;
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
        if (!combatants[potential_pos] && potential_tile !== TYPE.fire && potential_tile !== TYPE.water) {
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
const evalMapPosition = ({positions, combatants, tiles}) => {
    if (tiles.c === TYPE.fire) {
        // fire hurts bad
        return -50;
    } else if (tiles.c === TYPE.water) {
        // water hurts a bit
        return -5;
    } else if (tiles.c === TYPE.grass) {
        // grass is very good
        return 50;       
    } else if (
        (tiles.t === TYPE.grass) ||
        (tiles.l === TYPE.grass) ||
        (tiles.r === TYPE.grass) ||
        (tiles.b === TYPE.grass)
    ) {
        // non-diagonal next to grass is pretty good
        return 10;
    } else if (
        (tiles.tr === TYPE.grass) ||
        (tiles.tl === TYPE.grass) ||
        (tiles.br === TYPE.grass) ||
        (tiles.bl === TYPE.grass)
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

const getCombatantNextPosition = (current_position, tiles, window_width, combatants) => {
    let direction;
    let position;
    let attepts = 3;

    const posData = getSurroundingPos({position: current_position, window_width, tiles, combatants});
    const self = posData.combatants.c;

    const friendly_pos = Object.keys(posData.combatants)
        .filter(
            // not yourself
            ck => ck !== "c" && 
            // not diagonal
            ck.length === 1 && 
            // present and with same color
            posData.combatants[ck]?.color === self.color &&
            // not already spawning
            !posData.combatants[ck]?.spawning &&
            // are they old enough
            posData.combatants[ck]?.tick > MAX_YOUNGLING_TICK &&
            // not on fire
            posData.tiles[ck] !== TYPE.fire &&
            // not on water
            posData.tiles[ck] !== TYPE.water
            // TODO: add only mate with similar fitness
        )
        .map(frd => posData.positions[frd]);

    do {
        direction = Math.floor(Math.random() * Object.values(DIRECTION).length);
        if (friendly_pos.length > 1 && Math.random() > 0.1) {
            position = friendly_pos[Math.floor(Math.random() * friendly_pos.length)];
        } else {
            position = getNewPositionFromDirection(
                current_position, 
                direction, 
                window_width, 
                tiles.length);
        }
        attepts--;
        // avoid fire if you can
    } while (tiles[position] === TYPE.fire && attepts > 0);

    return position;
};

const getNewPositionFromDirection = (current_position, direction, window_width, tile_count) => {
    let new_position = current_position;
    switch (direction) {
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
                current_position + window_width < tile_count ? 
                    current_position + window_width : current_position;
            break;
        case DIRECTION.none:
            // fallthrough
        default:
            new_position = current_position;
            break;            
    }
    return new_position;
};

const calcMovements = ({combatants, window_width, tiles}) => {
    const new_combatants = {};
    Object.keys(combatants).forEach((position) => {
        const combatant = combatants[position];
        const current_position = parseInt(position);
        const new_position = getCombatantNextPosition(current_position, tiles, window_width, combatants);

        const occupient = new_combatants[new_position];
        if (!evalHealth(combatant)) {
            // you die
        } else if (!occupient) {
            // space is empty; OK to move there if you are healthy enough
            new_combatants[new_position] = combatant;
        } else if(occupient.color === combatant.color) {                
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
        } else if (c.color === self.color) {
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
        combatant.fitness += evalMapPosition(posData);
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
    constructor() {
        super();
        this.state = this.getInitState();
    }

    getInitState() {
        const tick = 0;
        const game_count = 1;
        const window_width = WINDOW_WIDTH;
        const window_height = WINDOW_HEIGHT;
        const num_combatants = NUM_COMBATANTS;
        const tick_speed = TICK_INTERVAL;
    
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

        return {
            tick,
            game_count,
            tick_speed,
            window_width,
            window_height,
            tiles,
            combatants,
        }
    }

    reset = () => {
        const game_count = this.state.game_count;
        const new_state = this.getInitState(this.state);
        new_state.game_count = game_count + 1;
        this.setState(new_state);
    }


    updateTickSpeed = ({tick_speed}) => {
        if (tick_speed < 0) {
            return;
        }

        const new_state = {};
        Object.assign(new_state, this.state);
        new_state.tick_speed = tick_speed
        this.setState(new_state);

        clearInterval(this.interval);
        if (tick_speed > 0) {
            this.interval = setInterval(() => this.tick(), tick_speed);
        }
    }

    pauseUnpause = () => {
        const new_state = {};
        Object.assign(new_state, this.state);
        new_state.tick_speed = this.state.tick_speed !== 0 ? 0 : this.state.prev_tick_speed ?? TICK_INTERVAL;
        new_state.prev_tick_speed = this.state.tick_speed;
        this.setState(new_state);

        clearInterval(this.interval);
        if (new_state.tick_speed > 0) {
            this.interval = setInterval(() => this.tick(), new_state.tick_speed);
        }    }

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
        this.interval = setInterval(() => this.tick(), this.state.tick_speed);
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
        if (idx % this.state.window_width === this.state.window_width - 1) {
            rows.push(<view className={'Row'} key={`row-${Math.floor(idx/this.state.window_width)}`}>{cells}</view>)
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
        <view>
            <view className={'Arena'}>
                {rows}
            </view>
            <Dashboard 
                combatants={this.state.combatants} 
                tiles={this.state.tiles} 
                tick={this.state.tick}
                tick_speed={this.state.tick_speed}
                game_count={this.state.game_count}
                arena_width={this.state.window_width}
                arena_height={this.state.window_height}
                onReset={this.reset}
                onUpdateTickSpeed={this.updateTickSpeed}
                onPauseUnpause={this.pauseUnpause}
            />
        </view>
    );
    }
}

export default Arena;