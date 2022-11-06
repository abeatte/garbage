import { TYPE } from "../components/Tile";
import { CHARACTORS } from "../components/Combatant";
import uuid from 'react-uuid';

const DIRECTION = {"left": 0, "up": 1, "right": 2, "down": 3, "none": 4};
const MAX_YOUNGLING_TICK = 5;
export const MIN_HEALTH = -500;

export function initCombatantStartingPos({tiles, combatants}) {
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

export function updateCombatantsPositionsAfterResize({combatants, window_width, window_height, old_window_width, old_window_height, tiles}) {
    const new_combatants = {};

    const dif_row = window_width - old_window_width;
    const dif_col = window_height - old_window_height;
    Object.keys(combatants).forEach(k => {
        let new_pos = k;
        let coord = [Math.floor(k / old_window_width), k % old_window_width];

        if (coord[1] >= window_width || coord[0] >= window_height) {
            // they fell off the world; let's try to move them up/left
            const posData = getSurroundingPos({position: k, window_width: old_window_width, tiles, combatants});
            const can_move_up = !posData.combatants.t;
            const can_move_diag = !posData.combatants.tl;
            const can_move_left = !posData.combatants.l;

            const dice_roll = Math.random();

            if (dice_roll < .33 && can_move_left && dif_col > -1) {
                new_pos = posData.positions.l;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (dice_roll < .66 && can_move_up && dif_row > -1) {
                new_pos = posData.positions.t;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else if (can_move_diag) {
                new_pos = posData.positions.tl;
                coord = [Math.floor(new_pos / old_window_width), new_pos % old_window_width];
            } else {
                new_pos = -1;
            }
        }
        
        if (dif_row !== 0) {
            // translate old coord to new coord
            new_pos = coord[0] * window_width + coord[1];
        }

        if (new_pos > -1 && new_pos < window_width * window_height) {
            const occupient = new_combatants[new_pos];
            // tie goes to whoever got there first.
            new_combatants[new_pos] = !!occupient ? compete(occupient, combatants[k]) : combatants[k];
        }

    })
    return new_combatants;
}

export function calcMovements({combatants, window_width, tiles}) {
    const new_combatants = {};
    let births = 0, deaths = 0;
    Object.keys(combatants).forEach((position) => {
        const combatant = combatants[position];
        const current_position = parseInt(position);
        const new_position = getCombatantNextPosition(current_position, tiles, window_width, combatants);

        const occupient = new_combatants[new_position];
        if (!evalHealth(combatant)) {
            // you die
            deaths++;
        } else if (!occupient) {
            // space is empty; OK to move there if you are healthy enough
            new_combatants[new_position] = combatant;
        } else if(occupient.team === combatant.team) {                
            new_combatants[current_position] = combatant;
            // space is occupied by a friendly
            if (occupient.tick > MAX_YOUNGLING_TICK && combatant.tick > MAX_YOUNGLING_TICK) {
                combatant.spawning = occupient;
                occupient.spawning = combatant;
                const spawned = spawnNextGen(
                    getSurroundingPos({
                        position: new_position, 
                        window_width, 
                        tiles, 
                        combatants: new_combatants
                    }), 
                    new_combatants, tiles.length);
                if (spawned) {
                    births++;
                }
            }
        } else {
            // space is occupied by a foe
            new_combatants[new_position] = compete(combatant, occupient)
            deaths++;
        }
    });

    return {combatants: new_combatants, births, deaths};
}

export function getRandomTeam() {
    return Object.values(CHARACTORS)[Math.round(Math.random() * (Object.values(CHARACTORS).length - 1))].team;
}

export function updateCombatants({combatants, window_width, tiles}) {
    Object.keys(combatants).forEach(position => {
        const combatant = combatants[position];
        const posData = getSurroundingPos({position, window_width, tiles, combatants});
        if (!combatant.immortal) {
            combatant.fitness += evalMapPosition(posData);
        }
        combatant.tick +=1;
    });
}

/**
 * @param {*} c combatant
 * @returns true if combatant should live
 */
 function evalHealth(c) {
    return c.fitness > MIN_HEALTH;
};

function spawnNextGen({positions, combatants, tiles}, live_combatants, arena_size) {
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
        } else if (c.team === self.team) {
            nearby_friends.push(c);
        } else {
            nearby_enemies.push(c);
        }
    });

    let spawned = false;
    if (nearby_enemies.length > 1) {
        // too dangerous, nothing happens
    } else {
        // safe, let's do it!
        const spawn_pos = positions[empty_space[Math.round(Math.random() * (empty_space.length - 1))]];
        delete self.spawning.spawning;
        delete self.spawning;
        live_combatants[spawn_pos] = {
            id: uuid(),
            name: "",
            fitness: 0,
            immortal: false, 
            // too many of my kind here, let's diverge
            team: nearby_friends.length < 4 ? self.team : getRandomTeam(),
            tick: 0,
        };
        spawned = true;
    }
    return spawned;
}

function getCombatantNextPosition(current_position, tiles, window_width, combatants) {
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
            // present and with same team
            posData.combatants[ck]?.team === self.team &&
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

function getNewPositionFromDirection(current_position, direction, window_width, tile_count) {
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

/**
 * @returns fitness between 0 and 100
 */
function evalMapPosition({positions, combatants, tiles}) {
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

/**
 * Ties go to the a_combatant (the attacker)
 * @param {*} a the attacking combatant
 * @param {*} b the defending combatant
 * @returns the fitter combatant
 */
function compete(a, b) {
    const a_fitness = a.immortal ? Infinity : a.fitness;
    const b_fitness = b.immortal ? Infinity : b.fitness;
    return b_fitness > a_fitness ? b: a;
}

function getSurroundingPos({position, window_width, tiles, combatants}) {
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