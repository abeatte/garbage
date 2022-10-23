import React from "react";
import {
    Button,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { COLORS } from "./combatant";

const getColorStats = (combatants) => {
    const colors = COLORS.reduce((colors, color) => {
        colors[color] = []
        return colors;
    }, {});

    Object.values(combatants).forEach(combatant => {
        colors[combatant.color].push(combatant);
    });

    const counts = Object.keys(colors).map(color => {
        return (
            <View key={color} style={styles.color_group}>
                <Text style={styles.color_title}>{`${color}`}</Text><Text>{` (${colors[color].length}): `}</Text>
                {colors[color].length < 1 ? 
                    (<Text>{"[ ]"}</Text>) : 
                    colors[color].map((c, idx, cs) => {
                        return ( 
                            <View key={idx} style={styles.row}>
                                {idx == 0 && <Text>{"["}</Text>}
                                <Text style={styles.fitness}>{c.fitness}</Text>
                                {idx == cs.length - 1 && <Text>{"]"}</Text>}
                            </View>
                        );
                    })
                }
            </View>
        );
    }).sort((a, b) => a.key.localeCompare(b.key));

    return (
        <View style={styles.stat_group}>
            <View>{counts}</View>
        </View>
    );
};

const Dashboard = ({combatants, tiles, tick, reset}) => {
    const colorStats = getColorStats(combatants);
    return (
        <View style={styles.stats}>
            <View>
                <Text style={styles.stat_group}>{`Tick: ${tick}`}</Text>
                <Text>{`Combatants: ${Object.keys(combatants).length}`}</Text>
                {colorStats}
                <Text style={styles.stat_group}>{}</Text>
                <Text style={styles.stat_group}>{}</Text>
                <Text style={styles.stat_group}>{}</Text>
                <Text>{}</Text>
                <Text>{}</Text>
                <Text>{}</Text>
                <Text>{}</Text>
                <Text>{}</Text>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    row: {
        display: "flex",
        flexDirection: "row",
    },
    fitness: {
        paddingHorizontal: 5,
    },
    stats: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        marginStart: 8,
    },
    stat_group: {
        display: "flex",
        marginTop: 8,
    },
    color_group: {
        display: "flex",
        flexDirection: "row",
    },
    color_title: {
        fontWeight: "bold",
        textTransform: "capitalize",
    },
});

export default Dashboard;