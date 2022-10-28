import React from "react";
import '../css/Dashboard.css'
import { COLORS } from "./Combatant";

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
            <view key={color} className={'Color_group'}>
                <text className={'Label'}>{`${color}`}</text><text>{` (${colors[color].length}): `}</text>
                {colors[color].length < 1 ? 
                    (<text>{"[ ]"}</text>) : 
                    colors[color].map((c, idx, cs) => {
                        return ( 
                            <view key={idx} className={'Row'}>
                                {idx === 0 && <text>{"["}</text>}
                                <text className={'Fitness'}>{c.fitness}</text>
                                {idx === cs.length - 1 && <text>{"]"}</text>}
                            </view>
                        );
                    })
                }
            </view>
        );
    }).sort((a, b) => a.key.localeCompare(b.key));

    return (
        <view className={'Stat_group'}>
            <view>{counts}</view>
        </view>
    );
};

const Dashboard = ({combatants, tiles, tick, game_count, onReset}) => {
    const colorStats = getColorStats(combatants);
    return (
        <view className={'Dashboard'}>
            <view className="stat_container">
                <view className={'Row'}>
                    <view className={'Row'}>
                        <text className={'Label'}>{'Game: '}</text>
                        <text>{game_count}</text>
                    </view>
                    <view className={'Row Count_item'}>
                        <text className={'Label'}>{'Tick: '}</text>
                        <text>{tick}</text>
                    </view>
                </view>
                <view className={'Row'}><text className={'Label'}>{`Combatants: `}</text><text>{`${Object.keys(combatants).length}`}</text></view>
                {colorStats}
            </view>
            <view className="Button_container">
                <button onClick={() => onReset()}><text>{"Restart"}</text></button>
            </view>
        </view>
    )
};

export default Dashboard;