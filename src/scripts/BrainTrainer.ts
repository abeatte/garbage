import { NeuralNetwork } from "brain.js/dist/src";
import { INeuralNetworkDatum, INeuralNetworkJSON } from "brain.js/dist/src/neural-network";
import { INeuralNetworkState } from "brain.js/dist/src/neural-network-types";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { DEFAULTS, MovementLogic } from "../data/boardSlice";
import { DiagonalMoves, getSurroundingPos, LegalMoves, PosData } from "../data/CombatantUtils";
import Maps from "../data/Map";
import Brain from "../models/Brain";
import CombatantModel, { Character, createCombatant, requestMove } from "../models/CombatantModel";
import { TileModel } from "../models/TileModel";

const brain = require('brain.js');

export type Input = {[position: string]: number};
export type Output = {[direction: string]: number};
interface TrainingSet extends INeuralNetworkDatum<Input, Output> {
    input: Input,
    output: Output,
}

const JSON_FILE_PATH = path.join(__dirname, '../data/');
const JSON_FILE_NAME = 'NeuralNetwork.json';
const NUM_TRAINING_MAPS = 10;

const getTrainingSet = (species: Character, current_position: number, posData: PosData, tiles: TileModel[], window_width: number,): TrainingSet => {
    const input = [...LegalMoves, ...DiagonalMoves].reduce((move_potentials, clockFace) => {
        const sur = posData.surroundings[clockFace];
        if (sur !== undefined) {
            const positive_shifted_potential = sur.tile.score_potential[species] + Math.abs(posData.min_potential);
            let range = Math.abs(posData.min_potential) + posData.max_potential;
            move_potentials[clockFace] = positive_shifted_potential * 1.0/range;
        }
        return move_potentials;
    }, {} as {[direction: string]: number});

    const requested_position = requestMove(
        {
            movement_logic: MovementLogic.DecisionTree, 
            brain, 
            posData, 
            current_position, 
            tiles, 
            window_width
        }
    );
    const output = {} as Output;
    output[posData.surroundings.findIndex(sur => sur?.position === requested_position)] = 1;
    // console.log('input:', input, 'output:', output);

    return { input, output };
}

const train = (species: Character, net: NeuralNetwork<Input, Output>) => {
    const training_sets = [] as TrainingSet[];

    // TODO: finish creating this so that the posData will have a Clockface.C combataint to use for species. 
    const trainer = createCombatant({spawn_position: 0, species, use_genders: false, global_combatant_stats: undefined});
    
    for(let map = 0; map < NUM_TRAINING_MAPS; map++) {
        const width = DEFAULTS.window_width;
        const height = DEFAULTS.window_height;
        const tiles = Maps[DEFAULTS.map].generate({width, height});

        for(let position = 0; position < tiles.length; position++) {
            const combatants: {[position: number]: CombatantModel} = {};            
            trainer.position = position;
            combatants[position] = trainer;
            const posData = getSurroundingPos({species, position, window_width: width, tiles, combatants})
            training_sets.push(getTrainingSet(species, position, posData, tiles, width));
        }

        console.log(`Training sets for ${species.toString()}: Built (${map + 1}/${NUM_TRAINING_MAPS})`);
    }

    console.log(`\nGenerated a total of ${training_sets.length} training sets for ${species.toString()}.\n`);

    // throw new Error();
    console.log('\nTraining...');
    net.train(training_sets, {
        log: (status: INeuralNetworkState) => {
            console.log(`Training Delta: ${status.error}`, '...'.repeat(status.iterations / 2000));
        },
        logPeriod: 2000,
    });
    console.log('Neural Network trained!\n');
}

const writeJSONToFile = (species: Character, nn_json: INeuralNetworkJSON) => {
    console.log('Writing JSON to file...');
    const file_path = JSON_FILE_PATH + species.toLowerCase() + '/' + JSON_FILE_NAME
    writeFileSync(JSON_FILE_PATH, JSON.stringify(nn_json), 'utf8');
    console.log(`JSON has been written for ${species.toString()}.\n`);
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

    Object.values(Character).forEach(c => {
        const net = Brain.init();
        train(c, net);
        writeJSONToFile(c, net.toJSON());
    });

    console.log('Training complete!\n');
}

run();
