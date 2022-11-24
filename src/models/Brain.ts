import { ClockFace, LegalMoves, PosData } from "../data/CombatantUtils";
import CombatantModel, { getNewPositionFromDirection } from "./CombatantModel";

// import on brain.js not supported. 
// import brain from 'brain.js';
const brain = require('brain.js');

// provide optional config object (or undefined). Defaults shown.
const config = {
    binaryThresh: 0.5,
    hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
    activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
    leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

// create a simple feed forward neural network with backpropagation
const net = new brain.NeuralNetwork(config);

const train = (combatant: CombatantModel, posData: PosData) => {
    // TODO: implement. 
    throw new Error("Not yet implemented!!!");


    net.train([
        { input: [0, 0], output: [0] },
        { input: [0, 1], output: [1] },
        { input: [1, 0], output: [1] },
        { input: [1, 1], output: [0] },
    ]);
}

const move = (combatant: CombatantModel, posData: PosData): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] = 
            posData.surroundings[direction]?.tile?.score_potential ?? -Infinity
        return move_potentials;
    }, {} as {[direction: string]: number});
    
    // TODO: getting "network not runnable error in console."
    const output: {[direction: string]: number} = net.run(move_potentials);
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
