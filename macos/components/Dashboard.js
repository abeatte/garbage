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
        colors[color] = 0
        return colors;
    }, {});

    Object.values(combatants).forEach(combatant => {
        colors[combatant.color] += 1;
    });

    const counts = Object.keys(colors).map(color => {
        return (<Text key={color}>{`${color}: ${colors[color]}`}</Text>);
    }).sort((a, b) => a.key.localeCompare(b.key));

    return (
        <View>{counts}</View>
    );
};

const Dashboard = ({combatants, tiles, tick, reset}) => {
    const colorStats = getColorStats(combatants);
    return (
        <View style={styles.stats}>
            <View>
                <Text style={styles.stat_group}>{`Tick: ${tick}`}</Text>
                <Text>{`Combatants: ${Object.keys(combatants).length}`}</Text>
                <View style={[styles.color_group, styles.stat_group]}>
                    <Text style={styles.color_title}>{'Colors:'}</Text><Text>{colorStats}</Text>
                </View>
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
    stats: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    stat_group: {
        display: "flex",
        marginVertical: 4,
    },
    color_group: {
        display: "flex",
        flexDirection: "row",
        paddingStart: 24,
    },
    color_title: {
        paddingEnd: 12,
    },
});

export default Dashboard;