import { NeuralNetwork } from "brain.js/dist/src";
import { ClockFace, LegalMoves, MIN_HEALTH, Sight } from "../data/utils/CombatantUtils";
import { Input, Output } from "../scripts/BrainTrainer";
import CombatantModel, { Character, getNewPositionFromClockFace } from "./CombatantModel";

const bunnyNeuralNetworkJSONPath = require('../data/nets/Bunny_NeuralNetwork.json');
const turtleNeuralNetworkJSONPath = require('../data/nets/Turtle_NeuralNetwork.json');
const lizardNeuralNetworkJSONPath = require('../data/nets/Lizard_NeuralNetwork.json');
const elephantNeuralNetworkJSONPath = require('../data/nets/Elephant_NeuralNetwork.json');
const dogNeuralNetworkJSONPath = require('../data/nets/Dog_NeuralNetwork.json');
const catNeuralNetworkJSONPath = require('../data/nets/Cat_NeuralNetwork.json');
const unicornNeuralNetworkJSONPath = require('../data/nets/Unicorn_NeuralNetwork.json');

const brain = require('brain.js');

const brains = {
    Bunny: bunnyNeuralNetworkJSONPath,
    Turtle: turtleNeuralNetworkJSONPath,
    Lizard: lizardNeuralNetworkJSONPath,
    Elephant: elephantNeuralNetworkJSONPath,
    Dog: dogNeuralNetworkJSONPath,
    Cat: catNeuralNetworkJSONPath,
    Unicorn: unicornNeuralNetworkJSONPath,
};

const init = (): { [species: string]: NeuralNetwork<Input, Output> } => {
    // https://www.npmjs.com/package/brain.js?activeTab=readme
    const config = {
        inputSize: 9,
        outputSize: 5,
        binaryThresh: 0.5,
        hiddenLayers: [9, 5, 5], // inputs -> 9 -> 5 -> 5 -> outputs
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    const nets: { [species: string]: NeuralNetwork<Input, Output> } = {};
    Object.values(Character).forEach(c => {
        // create a simple feed forward neural network with backpropagation
        const net = new brain.NeuralNetwork(config);

        const jsonFile = brains[c];
        if (jsonFile?.sizes?.length > 0) {
            net.fromJSON(jsonFile);
        }
        nets[c] = net;
    });

    return nets;
}

const move = (brain: NeuralNetwork<Input, Output>, combatant: CombatantModel, sight: Sight): number => {
    // keys are ClockFace values (b, t, l, r); values are potentials (53, -2, ...)
    const move_potentials = LegalMoves.reduce((move_potentials, direction) => {
        move_potentials[Object.keys(ClockFace)[direction]] =
            sight.surroundings[direction]?.tile?.score_potential[Character.Bunny] ?? MIN_HEALTH
        return move_potentials;
    }, {} as { [direction: string]: number });

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
        sight.window_width,
        sight.tile_count
    );

    return new_position;
}

const Brain = {
    init,
    move,
}

export default Brain;
