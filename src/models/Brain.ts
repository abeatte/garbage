import { NeuralNetwork } from "brain.js/dist/src";
import { ClockFace, LegalMoves, MIN_HEALTH, PosData } from "../data/CombatantUtils";
import { Input, Output } from "../scripts/BrainTrainer";
import CombatantModel, { Character, getNewPositionFromClockFace } from "./CombatantModel";

const neuralNetworkJSON = require('../data/NeuralNetwork.json');
const brain = require('brain.js');

const init = () => {
    // https://www.npmjs.com/package/brain.js?activeTab=readme
    const config = {
        inputSize: 9,
        outputSize: 5,
        binaryThresh: 0.5,
        hiddenLayers: [9, 5, 5], // inputs -> 9 -> 5 -> 5 -> outputs
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };
    // create a simple feed forward neural network with backpropagation
    const net = new brain.NeuralNetwork(config);
    
    if (neuralNetworkJSON?.sizes?.length > 0) {
        net.fromJSON(neuralNetworkJSON);
    }
    
    return net;
}

const move = (brain: NeuralNetwork<Input, Output>, combatant: CombatantModel, posData: PosData): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] = 
            posData.surroundings[direction]?.tile?.score_potential[Character.Bunny] ?? MIN_HEALTH
        return move_potentials;
    }, {} as {[direction: string]: number});

    const output = brain.run(move_potentials);

    const clockFace = Object.keys(output).reduce((clockFace, direction) => {
        if (clockFace === 0 || output[direction] > output[clockFace]) {
            return parseInt(direction);
        }
        return clockFace;
    }, 0);
    const new_position = getNewPositionFromClockFace(
        combatant.position, 
        clockFace, 
        posData.window_width, 
        posData.tile_count
    );

    return new_position;
}
  
  const Brain = {
    init, 
    move,
  }

  export default Brain;
