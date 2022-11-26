import { NeuralNetwork } from "brain.js/dist/src";
import { ClockFace, getDirectionFromClockFace, LegalMoves, PosData } from "../data/CombatantUtils";
import { TrainingType } from "../scripts/BrainTrainer";
import CombatantModel, { getNewPositionFromDirection } from "./CombatantModel";

const neuralNetworkJSONFile = require('../data/NeuralNetwork.json');
const brain = require('brain.js');

const init = () => {
    // provide optional config object (or undefined). Defaults shown.
    const config = {
        binaryThresh: 0.5,
        hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    // create a simple feed forward neural network with backpropagation
    const net = new brain.NeuralNetwork(config);
    net.fromJSON(neuralNetworkJSONFile);

    return net;
}

const move = (brain: NeuralNetwork<TrainingType, TrainingType>, combatant: CombatantModel, posData: PosData): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] = 
            posData.surroundings[direction]?.tile?.score_potential ?? -Infinity
        return move_potentials;
    }, {} as {[direction: string]: number});

    // "network not runnable" error in console without training model first.
    const output: {[direction: string]: number} = brain.run(move_potentials);

    // TODO: Combatants tend to just go right and into the fire. Not sure why. 
    const clockFace = Object.keys(output).reduce((move_direction, output_key) => {
        const potential = output[output_key];
        const current_potential = output[move_direction] ?? -Infinity;
        return potential > current_potential ? output_key as unknown as ClockFace : move_direction;
    }, ClockFace.c);
    const new_position = getNewPositionFromDirection(
        combatant.position, 
        getDirectionFromClockFace(clockFace), 
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
