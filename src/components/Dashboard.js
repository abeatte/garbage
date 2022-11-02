import React from "react";
import '../css/Dashboard.css'
import { useSelector, useDispatch } from 'react-redux'
import { speedUp, slowDown, pauseUnpause } from '../data/tickerSlice'
import Back from '../images/icons/back.png'
import Forward from '../images/icons/forward.png'
import Pause from '../images/icons/pause.png'
import Play from '../images/icons/play.png'
import { CHARACTORS } from "./Combatant";

const getTeamStats = (combatants) => {
    const teams = Object.values(CHARACTORS).reduce((teams, cha) => {
        teams[cha.team] = []
        return teams;
    }, {});

    Object.values(combatants).forEach(combatant => {
        teams[combatant.team].push(combatant);
    });

    const counts = Object.keys(teams).map(team => {
        return (
            <view key={team} className={'Team_group'}>
                <text className={'Label'}>{`${team}`}</text><text>{` (${teams[team].length}):`}</text>
                <view className="Data_row">
                    {teams[team].length < 1 ? 
                        (<text>{"[ ]"}</text>) : 
                        (<text>{
                            teams[team]
                                .sort((a, b) => b.fitness - a.fitness)
                                .slice(0, 10)
                                .reduce((result, c, idx, subset) => {
                                    if (idx === 0) {
                                        result += "[";
                                    }

                                    result += `${c.fitness}`;

                                    if (idx < teams[team].length - 1) {
                                        result += ', '
                                    }

                                    if (idx === teams[team].length - 1) {
                                        result += "]";
                                    } else if (idx === subset.length - 1) {
                                        result += " ... ]"
                                    }

                                    return result;
                                }, "")
                                }
                        </text>)}
                </view>
            </view>
        );
    }).sort((a, b) => a.key.localeCompare(b.key));

    return (
        <view className={'Stat_group'}>
            <view>{counts}</view>
        </view>
    );
};

const Dashboard = ({combatants, tiles, game_count, arena_width, arena_height, onReset, onUpdateBoard}) => {
    const updated = false;
    const teamStats = getTeamStats(combatants);

    const ticker = useSelector((state) => state.ticker);
    const dispatch = useDispatch()
   
    const speed_section = (
        <view className="Control_container">
            <text style={{alignSelf: 'center'}}>{`Speed: ${ticker.tick_speed}`}</text>
            <view className="Speed_buttons_container">
                <button onClick={() => {
                    dispatch(slowDown());
                }}>
                    <img className="Speed_button" alt="Back" src={Back} />
                </button>
                <button onClick={() => {
                    dispatch(pauseUnpause());
                }}>
                    <img 
                        className="Speed_button" 
                        alt={ticker.tick_speed === 0 ? "Play" : "Pause"} 
                        src={ticker.tick_speed === 0 ? Play : Pause} 
                    />
                </button>
                <button onClick={() => {
                    dispatch(speedUp());
                }}>
                    <img className="Speed_button" alt="Forward" src={Forward} />
                </button>
            </view> 
        </view>
    );
    const resize_section = (
        <>
            <view>
                <button onClick={() => {
                    onUpdateBoard({window_width: arena_width - 1, window_height: arena_height});
                }}>
                    <text>{"<"}</text>
                </button>
                <text>{`Width: ${arena_width}`}</text>
                <button onClick={() => {
                    onUpdateBoard({window_width: arena_width + 1, window_height: arena_height})
                }}>
                    <text>{">"}</text>
                </button>
            </view> 
            <view>
                <button onClick={() => {
                    onUpdateBoard({window_width: arena_width, window_height: arena_height - 1})
                }}>
                    <text>{"<"}</text>
                </button>
                <text>{`Height: ${arena_height}`}</text>
                <button onClick={() => {
                    onUpdateBoard({window_width: arena_width, window_height: arena_height + 1})
                }}>
                    <text>{">"}</text>
                </button>
            </view> 
        </>
    );

    return (
        <view className={'Dashboard'}>
            <view className="Control_container">
                <button className={`Update_button${updated ? " updated" : ""}`} onClick={() => onReset()}><text>{"Restart"}</text></button>
                {speed_section}
                {resize_section}
            </view>
            <view className="Stat_container">
                <view className={'Row'}>
                    <view className={'Row'}>
                        <text className={'Label'}>{'Game:'}</text>
                        <text className="Data_row">{game_count}</text>
                    </view>
                    <view className={'Row Count_item'}>
                        <text className={'Label'}>{'Tick:'}</text>
                        <text className="Data_row">{ticker.tick}</text>
                    </view>
                    <view className={'Row'}>
                        <text className={'Label'}>{`Combatants:`}</text>
                        <text className="Data_row">{`${Object.keys(combatants).length}`}</text>
                    </view>
                </view>
                {teamStats}
            </view>
        </view>
    )
};

export default Dashboard;