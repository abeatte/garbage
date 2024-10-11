import { ITrainingStatus } from "brain.js/dist/src/feed-forward";
import { INeuralNetworkDatum, INeuralNetworkJSON } from "brain.js/dist/src/neural-network";
import { INeuralNetworkState } from "brain.js/dist/src/neural-network-types";
import { writeFileSync } from "fs";
import path from "path";
import { GAME_DEFAULTS, Tiles } from "../data/slices/boardSlice";
import { DiagonalMoves, LegalMoves } from "../data/utils/CombatantUtils";
import Maps from "../data/Map";
import Brain from "../models/Brain";
import { Character } from "../models/CombatantModel";
import { Sight, viewSurroundings } from "../data/utils/SightUtils";
import Combatant, { DEFAULT_MODEL } from "../objects/combatants/Combatant";
import NPC from "../objects/combatants/NPC";
import { MovementLogic } from "../data/utils/GameUtils";

export type Input = { [position: string]: number };
export type Output = { [direction: string]: number };
interface TrainingSet extends INeuralNetworkDatum<Input, Output> {
    input: Input,
    output: Output,
}

const JSON_FILE_PATH = path.join(__dirname, '../data/nets/');
const JSON_FILE_NAME = 'NeuralNetwork.json';
const NUM_TRAINING_MAPS = 1;

const getTrainingSet = (species: Character, combatant: Combatant, sight: Sight, tiles: Tiles, window_width: number,): TrainingSet => {
    const input = [...LegalMoves, ...DiagonalMoves].reduce((move_potentials, clockFace) => {
        const sur = sight.surroundings[clockFace];
        if (sur !== undefined) {
            const positive_shifted_potential = sur.tile!.score_potential[species] + Math.abs(sight.min_potential);
            let range = Math.abs(sight.min_potential) + sight.max_potential;
            move_potentials[clockFace] = positive_shifted_potential * 1.0 / range;
        }
        return move_potentials;
    }, {} as { [direction: string]: number });

    const requested_position = combatant.requestMove(
        {
            movement_logic: MovementLogic.DecisionTree,
            sight,
            tiles,
        }
    );
    const output = {} as Output;
    output[sight.surroundings.findIndex(sur => sur?.position === requested_position)] = 1;
    // console.log('input:', input, 'output:', output);

    return { input, output };
}

const buildTrainingSets = (species: Character): TrainingSet[] => {
    const training_sets = [] as TrainingSet[];

    // TODO: finish creating this so that the sight will have a Clockface.C combataint to use for species. 
    const trainer = new NPC({ ...DEFAULT_MODEL, position: 0, species });

    for (let map = 0; map < NUM_TRAINING_MAPS; map++) {
        const width = GAME_DEFAULTS.tiles.width;
        const height = GAME_DEFAULTS.tiles.height;
        const tiles = Maps[GAME_DEFAULTS.map].generate({ width, height });
        // tiles.forEach((t, idx) => {
        //     getMapTileScorePotentials({ position: idx, tiles, window_width: width });
        // });
        debugger; // TODO: make sure tiles have score_potential setup at this point. 

        for (let position = 0; position < tiles.size; position++) {
            const combatants: { [position: number]: Combatant } = {};
            trainer.setPosition(position);
            combatants[position] = trainer;
            const sight = viewSurroundings({ species, position, tiles, combatants })
            training_sets.push(getTrainingSet(species, trainer, sight, tiles, width));
        }
    }
    return training_sets;
}

const writeJSONToFile = (species: Character, nn_json: INeuralNetworkJSON) => {
    const file_path = JSON_FILE_PATH + species.toString() + '_' + JSON_FILE_NAME
    writeFileSync(file_path, JSON.stringify(nn_json), 'utf8');
};

export function run() {
    const start_time = Date.now();

    const nets = Brain.init();
    const trainings: Promise<ITrainingStatus>[] = [];
    Object.values(Character).forEach(c => {
        const training_sets = buildTrainingSets(c);
        // throw new Error();
        trainings.push(nets[c].trainAsync(training_sets, {
            log: (status: INeuralNetworkState) => {
                const time_lapse = (Date.now() - start_time);
                const hours = Math.floor(time_lapse / (1000 * 60 * 60)),
                    minutes = Math.floor((time_lapse / (1000 * 60)) % 60),
                    seconds = Math.floor((time_lapse / 1000) % 60);

                const duration_string = `${hours}h ${minutes}m ${seconds}s`;

                console.log(
                    '[' + ('.'.repeat(status.iterations / 2000)) + (' '.repeat(10 - status.iterations / 2000)) + `] (${duration_string})`,
                    `Training Delta: ${status.error.toFixed(10)} (${c.toString()})`,
                );
            },
            logPeriod: 2000,
        }));
    });

    console.log("Running training...");
    console.log("(Note: this can take up to 30 min per Map)")
    Promise.all(trainings).then(_results => {
        Object.values(Character).forEach(c => {
            writeJSONToFile(c, nets[c].toJSON());
        });
        console.log('\nTraining complete!\n');
    });
}

run();
