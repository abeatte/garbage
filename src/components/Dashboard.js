import React from "react";
import '../css/Dashboard.css'
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
                <text className={'Label'}>{`${team}`}</text><text>{` (${teams[team].length}): `}</text>
                {teams[team].length < 1 ? 
                    (<text>{"[ ]"}</text>) : 
                    teams[team].map((c, idx, cs) => {
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

const Dashboard = ({combatants, tiles, tick, tick_speed, game_count, arena_width, arena_height, onReset, onUpdateTickSpeed, onPauseUnpause, onUpdateBoard}) => {
    const updated = false;
    const teamStats = getTeamStats(combatants);
   
    const speed_section = (
        <view className="Control_container">
            <text>{`Speed: ||${tick_speed}`}</text>
            <view className="Speed_buttons_container">
                <button onClick={() => {
                    onUpdateTickSpeed({tick_speed: tick_speed - 250});
                }}>
                    <img className="Speed_button" alt="Back" src={Back} />
                </button>
                <button onClick={() => {
                    onPauseUnpause();
                }}>
                    <img className="Speed_button" alt={tick_speed === 0 ? "Play" : "Pause"} src={tick_speed === 0 ? Play : Pause} />
                </button>
                <button onClick={() => {
                    onUpdateTickSpeed({tick_speed: tick_speed + 250});
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
                {teamStats}
            </view>
        </view>
    )
};

export default Dashboard;