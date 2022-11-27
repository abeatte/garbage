import { NeuralNetwork } from "brain.js/dist/src";
import { INeuralNetworkDatum, INeuralNetworkJSON } from "brain.js/dist/src/neural-network";
import { INeuralNetworkState } from "brain.js/dist/src/neural-network-types";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH, initDefaultTiles } from "../data/boardSlice";
import { getSurroundingPos, LegalMoves, MIN_HEALTH, PosData } from "../data/CombatantUtils";

const brain = require('brain.js');

export type TrainingType = {[direction: string]: number};
interface TrainingSet extends INeuralNetworkDatum<TrainingType, TrainingType> {
    input: TrainingType,
    output: TrainingType,
}

const JSON_FILE_PATH = path.join(__dirname, '../data/NeuralNetwork.json');
const NUM_TRAINING_MAPS = 10;

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
    
    for(let map = 0; map < NUM_TRAINING_MAPS; map++) {
        const width = DEFAULT_WINDOW_WIDTH;
        const height = DEFAULT_WINDOW_HEIGHT;
        const tiles = initDefaultTiles({width, height});

        for(let position = 0; position < tiles.length; position++) {
            const posData = getSurroundingPos({position, window_width: width, tiles, combatants: {}})
            training_sets.push(getTrainingSet(posData));
        }

        console.log(`Training sets for map ${map}: Built (${map + 1}/${NUM_TRAINING_MAPS})`);
    }

    console.log(`\nGenerated a total of ${training_sets.length} training sets.\n`);

    console.log('\nTraining...');
    net.train(training_sets, {
        log: (status: INeuralNetworkState) => {
            console.log(`Training Delta: ${status.error}`, '...'.repeat(status.iterations / 2000));
        },
        logPeriod: 2000,
    });
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
