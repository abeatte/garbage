/**
 * 
 */

import React from "react";
import {
    StyleSheet,
    View,
} from 'react-native';
import Tile from "./tile";

const initDefaultTiles = ({width, height}) => {
    const tiles = [];
    let idx = 0;
    for (h = 0; h < height; h++) {
        for (w = 0; w < width; w++) {
            if (h == 0 || h == height-1 || w == 0 || w == width-1) {
                tiles[idx] = "fire";
            } else if (h > height/4 && h < height/4*3 && w > width/4 && w < width/4*3) {
                tiles[idx] = "rock";
            } else {
                tiles[idx] = "sand";
            }
            idx++;
        }
    }
    return tiles;
}

const Arena = () => {
    const width = 24;
    const height = 12;
    const tiles = initDefaultTiles({width, height});
    
    console.log('abeatte', tiles);

    const rows = [];
    let idx = 0;
    for(let h = 0; h < height; h++) {
        const cells = []
        for (let w = 0; w < width; w++) {
            cells.push(<Tile type={tiles[idx++]}/>);
        }
        rows.push(<View style={styles.row}>{cells}</View>)
    }
    return (
        <View style={styles.arena}>
            {rows}
        </View>
    );
}

const styles = StyleSheet.create({
    arena: {
        display: "flex",
        flexDirection: "column",
    },
    row: {
        display: "flex",
        flexDirection: "row",
    }
})

export default Arena;