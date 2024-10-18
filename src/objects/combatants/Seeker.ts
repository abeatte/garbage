import { Tiles } from "../../data/slices/boardSlice";
import { DirectionalMoves } from "../../data/utils/CombatantUtils";
import { viewSurroundings } from "../../data/utils/SightUtils";
import { isValidCombatantPosition } from "../../data/utils/TurnProcessingUtils";
import { DecisionType, State } from "../../models/CombatantModel";
import { TileModel } from "../../models/TileModel";
import Combatant from "./Combatant";

export default class Seeker extends Combatant {

    static IsOf(model: { decision_type?: DecisionType }): boolean {
        return model.decision_type === DecisionType.Seeker;
    }

    beBorn(position: number, friendlies: Combatant[]): void {
        this.setState(State.Alive);
        this._model.target_waypoints.push(position);
    }

    getSpawnDecisionType(): DecisionType {
        return DecisionType.Seeker;
    }

    requestMoveImpl(args: {
        tiles: Readonly<Tiles>,
        best_target_position: number,
        best_mate_position: number,
        best_open_position: number;
        new_random_position: number,
    }): number {
        return this.basic(args);
    }

    private aStar(args: {
        tiles: Readonly<Tiles>,
        window_width: number,
        best_target_position: number;
        best_mate_position: number;
        best_open_position: number;
        new_random_position: number;
    }) {
        const self = this._model;
        // seekers go directly toward their target.
        let target_destination = self.target_waypoints.shift();
        if (
            // nowhere to go
            target_destination === undefined ||
            // already got there
            target_destination === self.position ||
            // can't get there
            !isValidCombatantPosition(target_destination, args.tiles)
        ) {
            target_destination = self.position;
            self.target_waypoints = aStar(
                this,
                args.tiles,
                args.window_width,
                this.getPosition(),
                Math.floor(Math.random() * (args.tiles.size - 1)) + args.tiles.start,
            );
        }

        return target_destination;
    }

    private basic(args: { tiles: Readonly<Tiles> }) {
        const self = this._model;
        let position;
        // seekers go directly toward their target.
        let target_destination = self.target_waypoints[0];
        if (
            // nowhere to go
            target_destination === undefined ||
            // already got there
            target_destination === self.position ||
            // can't get there
            !isValidCombatantPosition(target_destination, args.tiles)
        ) {
            target_destination = self.position;
            self.target_waypoints = [Math.floor(Math.random() * (args.tiles.end - args.tiles.start + 1) + args.tiles.start)];
        }

        position = this.moveTowardPosition({ target_destination, tiles: args.tiles });
        if (position === self.position) {
            // hack to reset target position when you run into a wall.
            self.target_waypoints = [Math.floor(Math.random() * (args.tiles.size - 1)) + args.tiles.start];
        }

        return position;
    }
}


interface TileNode {
    tile: TileModel,
    total_cost: number,
    path_cost: number,
    heuristic_cost: number,
    parent: TileNode | null,
};

function aStar(
    combatant: Combatant,
    tiles: Readonly<Tiles>,
    window_width: number,
    start: number,
    end: number,
): number[] {
    const openList: TileNode[] = [];
    const closedList: TileNode[] = [];

    openList.push({
        tile: tiles.t[start]!,
        total_cost: 0,
        path_cost: 0,
        heuristic_cost: 0,
        parent: null
    },
    );

    while (openList.length > 0) {
        let lowInd = 0;
        for (let i = 0; i < openList.length; i++) {
            if (openList[i].tile.score_potential[combatant.getSpecies()] < openList[lowInd].tile.score_potential[combatant.getSpecies()]) {
                lowInd = i;
            }
        }

        const currentNode = openList[lowInd];

        if (currentNode.tile.index === end) {
            let path = [];
            let current: TileNode | null = currentNode;
            while (current !== null) {
                path.push(current);
                current = current.parent;
            }
            path = path.reverse().map((node) => {
                return node.tile.index;
            });
            path.shift();
            return path;
        }

        openList.splice(lowInd, 1);
        closedList.push(currentNode);

        const sight = viewSurroundings({ species: combatant.getSpecies(), position: currentNode.tile.index, tiles });
        for (const direction of DirectionalMoves) {
            const neighbor = sight.surroundings[direction];
            if (neighbor === undefined || closedList.some(node => node.tile.index === neighbor.position)) {
                continue;
            }

            const gScore = currentNode.path_cost + 1;
            const hScore = heuristic(neighbor.position, end);
            const fScore = gScore + hScore;

            if (neighbor.tile && !openList.some(node => node.tile.index === neighbor.position)) {
                openList.push({
                    tile: neighbor.tile,
                    path_cost: gScore,
                    heuristic_cost: hScore,
                    total_cost: fScore,
                    parent: currentNode,
                });
            } else {
                const existingNode = openList.find(node => node.tile.index === neighbor.position);
                if (gScore < existingNode!.path_cost) {
                    existingNode!.path_cost = gScore;
                    existingNode!.total_cost = fScore;
                    existingNode!.parent = currentNode;
                }
            }
        }
    }

    return [];
}

function heuristic(node: number, goal: number): number {
    // Manhattan distance heuristic
    return Math.abs(node - goal);
}
