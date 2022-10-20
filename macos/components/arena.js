/**
 * 
 */

import React from "react";
import {
    StyleSheet,
    View,
} from 'react-native';
import Combatant from "./combatant";
import Tile from "./tile";

const initDefaultTiles = ({width, height}) => {
    const tiles = [];
    let idx = 0;
    for (h = 0; h < height; h++) {
        for (w = 0; w < width; w++) {
            if (h == 0 || h == height-1 || w == 0 || w == width-1) {
                tiles[idx] = "fire";
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = Math.random() < 0.05 ? "grass" : "rock";
            } else {
                tiles[idx] = "sand";
            }
            idx++;
        }
    }
    return tiles;
};

const initCombatantStartingPos = ({tiles}) => {
    let starting_pos;
    for (let i = 0; i < 10 && !starting_pos; i++) {
        const potential_pos = Math.round(Math.random() * tiles.length);
        const potential_tile = tiles[potential_pos];
        if (potential_tile != "fire" && potential_tile != "water") {
            starting_pos = potential_pos;
        }
    }

    return starting_pos ?? 0;
};

const Arena = () => {
    const width = 24;
    const height = 12;
    const tiles = initDefaultTiles({width, height});

    const combatant_position = initCombatantStartingPos({tiles});
    console.log('combatant_position', combatant_position);

    const rows = [];
    let idx = 0;
    for(let h = 0; h < height; h++) { 
        const cells = []
        for (let w = 0; w < width; w++) {
            cells.push(
                <Tile type={tiles[idx++]} key={idx}>
                    {combatant_position == idx ? (<Combatant/>) : null}
                </Tile>
            );
        }
        rows.push(<View style={styles.row} key={`row-${h}`}>{cells}</View>)
    }
    return (
        <View style={styles.arena}>
            {rows}
        </View>
    );
};

const styles = StyleSheet.create({
    arena: {
        display: "flex",
        flexDirection: "column",
    },
    row: {
        display: "flex",
        flexDirection: "row",
    }
});

export default Arena;