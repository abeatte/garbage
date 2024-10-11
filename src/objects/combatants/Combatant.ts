import uuid from "react-uuid";
import CombatantModel, { Character, DecisionType, Gender, getMapTileEffect, getRandomCombatantName, getRandomSpecies, State, Strength } from "../../models/CombatantModel";
import { GlobalCombatantStatsModel, getStrengthRating } from "../../models/GlobalCombatantStatsModel";
import { ClockFace, GetCombatant, IllegalMoves, MAX_YOUNGLING_TICK, MIN_HEALTH } from "../../data/utils/CombatantUtils";
import { Sight, viewSurroundings } from "../../data/utils/SightUtils";
import { isTileValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import Brain from "../../models/Brain";
import Entity from "../Entity";
import { MovementLogic } from "../../data/utils/GameUtils";
import { Combatants, Tiles } from "../../data/slices/boardSlice";

const Brains = Brain.init();

export const DEFAULT_MODEL = {
    id: uuid(),
    name: getRandomCombatantName(),
    is_player: false,
    target_waypoints: [],
    state: State.Alive,
    kills: 0,
    fitness: 0,
    strength: Strength.Average,
    decision_type: Object.values(DecisionType)[Math.floor(Math.random() * Object.values(DecisionType).length)],
    immortal: false,
    species: getRandomSpecies(),
    gender: Math.random() < .5 ? Gender.Male : Gender.Female,
    tick: 0,
    position: -1,
    visited_positions: {},
    spawn: undefined,
    children: 0,
};

export default abstract class Combatant extends Entity<CombatantModel> {
    protected _model: CombatantModel;

    constructor(model: CombatantModel, global_combatant_stats?: GlobalCombatantStatsModel) {
        super();
        this._model = model;

        this._model.strength = getStrengthRating({ global_combatant_stats: global_combatant_stats, fitness: this._model.fitness, immortal: this._model.immortal })

        if (Object.keys(this._model.visited_positions).length === 0) {
            this._model.visited_positions = {} as { [position: number]: number };
            this._model.visited_positions[model.position] = model.position;
        }

        if (this._model.target_waypoints.length === 0) {
            this._model.target_waypoints = [];
        }
    }

    getID(): string {
        return this._model.id;
    }

    getState(): State {
        return this._model.state
    }

    isDead(): boolean {
        return this.getState() === State.Dead;
    }

    isCaptured(): boolean {
        return this.getState() === State.Captured;
    }

    isMating(): boolean {
        return this.getState() === State.Mating;
    }

    setState(state: State) {
        return this._model.state = state;
    }

    getAge(): number {
        return this._model.tick;
    }

    increaseAge(amount: number) {
        this._model.tick += amount;
    }

    tick() {
        this._model.tick += 1;
    }

    isYoung() {
        return this.getAge() > MAX_YOUNGLING_TICK;
    }

    getGender(): Gender {
        return this._model.gender;
    }

    getDecisionType(): DecisionType {
        return this._model.decision_type;
    }

    isImmortal(): boolean {
        return this._model.immortal;
    }

    getFitness(): number {
        return this._model.immortal ? Infinity : this._model.fitness;
    }

    affectFitness(health: number) {
        this._model.fitness += health;
        if (this._model.fitness < MIN_HEALTH) {
            this.setState(State.Dead);
        }
    }

    kill() {
        this._model.state = State.Dead;
    }

    getStrength(): Strength {
        return this._model.strength;
    }

    updateStrengthRating(strength: Strength) {
        return this._model.strength = strength;
    }

    isPlayer(): boolean {
        return this._model.is_player;
    }

    getSpecies(): Character {
        return this._model.species;
    }

    getPosition(): number {
        return this._model.position;
    }

    setPosition(position: number) {
        this._model.position = position;
        this._model.visited_positions[position] = position;
    }

    toModel(): CombatantModel {
        return this._model;
    }

    recordKill(other: Combatant) {
        this._model.kills += 1;
    }

    capture() {
        this.setState(State.Captured);
        this.setPosition(-1);
    }

    releaseFromCaptivity(duration: number) {
        if (this.getState() !== State.Captured) {
            return;
        }

        this.setState(State.Alive);
        this.increaseAge(duration);
    }

    fightWith(other: Combatant): Combatant {
        if (other.getFitness() > this.getFitness()) {
            this.setState(State.Dead);
            other.recordKill(this);
            return other;
        } else {
            other.setState(State.Dead);
            this.recordKill(other);
            return this;
        }
    }

    canMateWith(potential: Combatant, use_genders: boolean) {
        return this.getAge() > MAX_YOUNGLING_TICK && potential.getAge() > MAX_YOUNGLING_TICK &&
            (
                !use_genders ||
                this.getGender() !== potential.getGender()
            );
    }

    mateWith(sight: Sight, mate: Combatant, global_combatant_stats: GlobalCombatantStatsModel) {
        this._model.state = State.Mating;
        mate.setState(State.Mating);

        this._model.spawn = GetCombatant({
            ...DEFAULT_MODEL,
            species: this._model.species,
            // 1:4 chance of a different decision_type from the parent
            decision_type: Math.random() > 0.25 ? this.getDecisionType() : getRandomDecisionType(),
        },
            global_combatant_stats,
        ).toModel();
    }

    isPregnant() {
        return this._model.spawn !== undefined;
    }

    fatherSpawn() {
        this.setState(State.Alive);
        this._model.children += 1;
    }

    birthSpawn({ tiles, combatants }: {
        tiles: Tiles,
        combatants: Combatants,
    }): Combatant | undefined {
        const spawn = GetCombatant(this._model.spawn);
        if (spawn === undefined) {
            return undefined;
        }

        const sight = viewSurroundings({
            species: spawn.getSpecies(),
            position: this.getPosition(),
            tiles,
            combatants,
        });

        const { surroundings } = sight;
        const friendly_positions: Combatant[] = [],
            enemy_positions: Combatant[] = [],
            empty_positions: number[] = [];

        surroundings.forEach((surrounding, idx, s_arr) => {
            if (surrounding === undefined || !isTileValidCombatantPosition(surrounding.tile)) {
                return;
            }

            const { position, occupant: c } = surrounding;

            if (!c) {
                if (position > -1 && position < tiles.end) {
                    empty_positions.push(position)
                }
            } else if (c.getSpecies() === this.getSpecies()) {
                friendly_positions.push(c);
            } else {
                enemy_positions.push(c);
            }
        });

        if (enemy_positions.length > 1) {
            // spawn dies; too dangerous
        } else {
            // safe, let's do it!
            const spawn_pos = empty_positions.length > 0 ?
                empty_positions[Math.round(Math.random() * (empty_positions.length - 1))] :
                -1;
            if (spawn_pos > -1) {
                spawn.beBorn(spawn_pos, friendly_positions);
            }
        }

        this.setState(State.Alive);
        this._model.children += 1;
        this._model.spawn = undefined;

        return spawn;
    }

    beBorn(position: number, friendlies: Combatant[]) {
        this.setPosition(position);
        if (friendlies.length >= 4) {
            // too many of my kind here, let's diverge
            this._model.species = getRandomSpecies();
        }
        this.setState(State.Alive);
    }

    requestMove(args:
        {
            movement_logic: MovementLogic,
            sight: Sight,
            tiles: Readonly<Tiles>,
        }): number {
        const self = this._model;
        let position: number;
        switch (args.movement_logic) {
            case MovementLogic.NeuralNetwork:
                // TODO: the Neural Network is blind to mating situations. 
                // this causes combatants to just sit in one spot when near others. 
                position = Brain.move(Brains[self.species], self, args.sight);
                break;
            case MovementLogic.RandomWalk:
                position = args.sight.getNewRandomPosition();
                break;
            case MovementLogic.DecisionTree:
                const bucketed_enemy_strengths: { [key: string]: number[] } = {};
                const bucketed_ally_strengths: { [key: string]: number[] } = {};
                const bucketed_mate_strengths: { [key: string]: number[] } = {};
                const bucketed_empty_tiles: { [key: string]: number[] } = {};

                args.sight.surroundings.forEach((surrounding, idx, s_arr) => {
                    if (surrounding === undefined || !isTileValidCombatantPosition(surrounding.tile)) {
                        return;
                    }

                    if ([ClockFace.c, ...IllegalMoves].includes(idx)) {
                        // don't count yourself or diagonal positions
                        return;
                    }

                    const occupant = surrounding.occupant;
                    if (!occupant) {
                        if (surrounding.tile !== undefined) {
                            if (bucketed_empty_tiles[surrounding.tile.score_potential[self.species]] === undefined) {
                                bucketed_empty_tiles[surrounding.tile.score_potential[self.species]] = [];
                            }
                            bucketed_empty_tiles[surrounding.tile.score_potential[self.species]].push(surrounding.position);
                        }
                    } else if (
                        // same species
                        occupant.getSpecies() === self.species &&
                        // not already 'engaged'
                        !occupant.isMating() &&
                        // not too young
                        !occupant.isYoung() &&
                        // not on hurtful tile
                        (getMapTileEffect({ species: self.species, tileType: surrounding.tile?.type }) > -1)
                    ) {
                        const strength = occupant.getStrength();
                        if (bucketed_mate_strengths[strength] === undefined) {
                            bucketed_mate_strengths[strength] = [];
                        }
                        bucketed_mate_strengths[strength].push(surrounding.position);
                    } else if (occupant.getSpecies() === self.species) {
                        const strength = occupant.getStrength();
                        if (bucketed_ally_strengths[strength] === undefined) {
                            bucketed_ally_strengths[strength] = [];
                        }
                        bucketed_ally_strengths[strength].push(surrounding.position);
                    } else if (
                        // enemy
                        occupant.getSpecies() !== self.species
                    ) {
                        const strength = occupant.getStrength();
                        if (bucketed_enemy_strengths[strength] === undefined) {
                            bucketed_enemy_strengths[strength] = [];
                        }
                        bucketed_enemy_strengths[strength].push(surrounding.position);
                    }
                });

                // position based on best prey (enemy) space
                let best_target_position = getBestTargetPosition(self, bucketed_enemy_strengths);

                // if a fighter has no enemy to fight then they fight an ally
                if (
                    best_target_position === -1 &&
                    self.decision_type === DecisionType.Fighter
                ) {
                    best_target_position = getBestTargetPosition(self, bucketed_ally_strengths);
                }

                // position based on best mate space
                let best_mate_position = getBestTargetPosition(self, bucketed_mate_strengths);

                // position based on best safe space
                let best_open_position = getBestOpenPosition(self, args.movement_logic, bucketed_empty_tiles);

                // position based on next random space
                const new_random_position = args.sight.getNewRandomPosition();

                position = this.requestMoveImpl({ tiles: args.tiles, best_target_position, best_mate_position, best_open_position, new_random_position });
                break;
        }

        return position;
    }

    requestMoveImpl(
        args: {
            tiles: Readonly<Tiles>,
            best_target_position: number,
            best_mate_position: number,
            best_open_position: number,
            new_random_position: number,
        }
    ): number {
        const self = this._model;
        let position;

        // Wanderers are disinterested in places they have been before
        if (self.decision_type === DecisionType.Wanderer) {
            if (self.visited_positions[args.best_target_position] !== undefined) {
                args.best_target_position = -1;
            }
            if (self.visited_positions[args.best_mate_position] !== undefined) {
                args.best_mate_position = -1;
            }
            if (self.visited_positions[args.best_open_position] !== undefined) {
                args.best_open_position = -1;
            }
        }

        if (args.best_target_position !== -1) {
            position = args.best_target_position;
        }

        if (
            args.best_mate_position !== -1 &&
            (self.decision_type === DecisionType.Lover ||
                // % chance you'll choose to mate
                Math.random() > 0.5)
        ) {
            position = args.best_mate_position;
            self.state = State.Mating;
        } else if (args.best_open_position !== -1) {
            position = args.best_open_position;
        } else {
            // when all else fails, random walk
            position = args.new_random_position;
        };

        return position;
    }
}

function getBestTargetPosition(
    self: CombatantModel, bucketed_target_strengths: { [key: string]: number[] }
): number {
    const compareStrength = (a: Strength | undefined, b: Strength | undefined): number => {
        if (b === undefined) {
            return 1;
        } else if (a === undefined) {
            return -1;
        } else if (b === a) {
            return 0;
        } else if (a === Strength.Immortal) {
            return 1;
        } else if (a === Strength.Strong && b !== Strength.Immortal) {
            return 1;
        } else if (a === Strength.Average && (b !== Strength.Immortal && b !== Strength.Strong)) {
            return 1;
        } else {
            return -1;
        }
    };
    // position based on best prey (enemy) space
    let strength_buckets = Object.keys(bucketed_target_strengths) as Strength[];
    strength_buckets = strength_buckets.sort((a, b) => -compareStrength(a, b));
    strength_buckets.filter(s => compareStrength(s, self.strength) > 0);
    const best_target_bucket = bucketed_target_strengths[strength_buckets[0]] ?? [];
    const best_target_position = best_target_bucket.length > 0 ?
        best_target_bucket[Math.floor(Math.random() * best_target_bucket.length)] : -1;

    return best_target_position;
}

// All types like open spaces;
function getBestOpenPosition(
    self: CombatantModel, movement_logic: MovementLogic, bucketed_empty_tiles: { [key: string]: number[] }
): number {
    // position based on best safe space
    const best_empty_bucket = bucketed_empty_tiles[Object.keys(bucketed_empty_tiles)
        .sort((a, b) => parseInt(b) - parseInt(a))[0]]
    const best_safe_position = best_empty_bucket?.length > 0 ?
        best_empty_bucket[Math.floor(Math.random() * best_empty_bucket.length)] : -1;

    return best_safe_position;
}

function getRandomDecisionType(): DecisionType {
    const set = Object.keys(DecisionType);
    return set[Math.round(Math.random() * (set.length - 1))] as DecisionType;
}