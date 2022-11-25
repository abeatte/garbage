import { initDefaultTiles } from "../data/boardSlice";
import { ClockFace, getSurroundingPos, LegalMoves, MIN_HEALTH, PosData } from "../data/CombatantUtils";
import CombatantModel, { getNewPositionFromDirection } from "./CombatantModel";
// import on brain.js not supported. 
// import brain from 'brain.js';
const brain = require('brain.js');

interface TrainingSet {
    input: {[direction: string]: number},
    output: {[direction: string]: number},
}

// provide optional config object (or undefined). Defaults shown.
const config = {
    binaryThresh: 0.5,
    hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
    activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
    leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

// create a simple feed forward neural network with backpropagation
const net = new brain.NeuralNetwork(config);

const train = () => {
    const training_sets = [] as TrainingSet[];

    const for_training = true;
    const position = 4; // 4 = center
    const width = 3, height = 3;

    // 1. create 20,000 training sets using 3x3 maps with no combatants
    for(let i = 0; i < 500; i++) {

        const tiles = initDefaultTiles({for_training, width, height})
        const posData = getSurroundingPos({position, window_width: width, tiles, combatants: {}})
        training_sets.push(getTrainingSet(posData));
    }


    net.train(training_sets);
}

const getTrainingSet = (posData: PosData): TrainingSet => {
    const input = {} as {[direction: string]: number}, 
    output = {} as {[direction: string]: number};

    posData.surroundings.forEach((surrounding, idx) => {
        if (!surrounding || !LegalMoves.includes(idx)) {
            input[idx] = MIN_HEALTH;
            output[idx] = MIN_HEALTH;
        } else {
            input[idx] = surrounding.tile.tile_effect;
            output[idx] = surrounding.tile.score_potential;
        }
    });

    return { input, output };
}

const move = (combatant: CombatantModel, posData: PosData): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] = 
            posData.surroundings[direction]?.tile?.score_potential ?? -Infinity
        return move_potentials;
    }, {} as {[direction: string]: number});

    // train();
    // debugger;

    // "network not runnable" error in console without training model first.
    const output: {[direction: string]: number} = net.run(move_potentials);
    debugger;

    const move_direction = Object.keys(output).reduce((move_direction, output_key) => {
        const potential = output[output_key];
        const current_potential = output[move_direction] ?? -Infinity;
        return potential > current_potential ? output_key as unknown as ClockFace : move_direction;
    }, ClockFace.c);
    const new_position = getNewPositionFromDirection(
        combatant.position, 
        move_direction, 
        posData.window_width, 
        posData.tile_count
    );

    return new_position;
}
  

  const Brain = {
    train,
    move,
  }

  export default Brain;
