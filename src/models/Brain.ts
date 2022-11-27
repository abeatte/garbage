import { NeuralNetwork } from "brain.js/dist/src";
import { ClockFace, LegalMoves, MIN_HEALTH, PosData } from "../data/CombatantUtils";
import { Input, Output } from "../scripts/BrainTrainer";
import CombatantModel, { getNewPositionFromClockFace } from "./CombatantModel";

const neuralNetworkJSONFile = require('../data/NeuralNetwork.json');
const brain = require('brain.js');

const init = () => {
    // provide optional config object (or undefined). Defaults shown.
    const config = {
        binaryThresh: 0.5,
        hiddenLayers: [9, 5, 5], // inputs -> 9 -> 5 -> 5 -> outputs
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    // create a simple feed forward neural network with backpropagation
    const net = new brain.NeuralNetwork(config);
    net.fromJSON(neuralNetworkJSONFile);

    return net;
}

const move = (brain: NeuralNetwork<Input, Output>, combatant: CombatantModel, posData: PosData): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] = 
            posData.surroundings[direction]?.tile?.score_potential ?? MIN_HEALTH
        return move_potentials;
    }, {} as {[direction: string]: number});

    // "network not runnable" error in console without training model first.
    const output = brain.run(move_potentials);

    const clockFace = parseInt(Object.keys(output)[0]) as ClockFace;
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
