import { NeuralNetwork } from "brain.js/dist/src";
import { INeuralNetworkDatum, INeuralNetworkJSON } from "brain.js/dist/src/neural-network";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { initDefaultTiles } from "../data/boardSlice";
import { getSurroundingPos, LegalMoves, MIN_HEALTH, PosData } from "../data/CombatantUtils";

const brain = require('brain.js');

export type TrainingType = {[direction: string]: number};
interface TrainingSet extends INeuralNetworkDatum<TrainingType, TrainingType> {
    input: TrainingType,
    output: TrainingType,
}

const JSON_FILE_PATH = path.join(__dirname, '../data/NeuralNetwork.json');
const TRAINING_SETS = 100

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

const train = (net: NeuralNetwork<TrainingType, TrainingType>) => {
    const training_sets = [] as TrainingSet[];

    const for_training = true;
    const position = 4; // 4 = center
    const width = 3, height = 3;

    // 1. create 20,000 training sets using 3x3 maps with no combatants
    for(let i = 1; i < TRAINING_SETS + 1; i++) {
        if (i%10 === 0) {
            console.log(`Building Training sets: (${i}/${TRAINING_SETS})`);
        }

        const tiles = initDefaultTiles({for_training, width, height})
        const posData = getSurroundingPos({position, window_width: width, tiles, combatants: {}})
        training_sets.push(getTrainingSet(posData));
    }

    console.log('\nTraining...');
    net.train(training_sets);
    console.log('Neural Network trained!\n');
}

const writeJSONToFile = (nn_json: INeuralNetworkJSON) => {
    console.log('Writing JSON to file...');
    writeFileSync(JSON_FILE_PATH, JSON.stringify(nn_json), 'utf8');
    console.log('JSON has been written.\n');
};

const readTextFromJSONFile = (): string => {
    const file_exists = existsSync(JSON_FILE_PATH);
    console.log('JSON file: ', file_exists);

    let text = '';
    if (file_exists) {
        console.log('Reading JSON from file...');
        text = readFileSync(JSON_FILE_PATH, 'utf8');
        console.log('JSON has been read.\n');
    }
    
    return text;
}

export function run() {
    console.log("Commencing training...")

    const config = {
        binaryThresh: 0.5,
        hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    // create a simple feed forward neural network with backpropagation
    const net = new brain.NeuralNetwork(config);

    const json_text = readTextFromJSONFile();
    console.log(json_text, '\n');
    if (json_text.length > 0 && json_text !== "{}") {
        net.fromJSON(JSON.parse(json_text));
    }
    train(net);
    writeJSONToFile(net.toJSON());

    console.log('Training complete!\n');
}

run();
