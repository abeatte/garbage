import React from "react";
import '../css/Dashboard.css'
import classNames from "classnames";
import { useSelector, useDispatch } from 'react-redux'
import { speedUp, slowDown, pauseUnpause } from '../data/tickerSlice'
import { shrinkWidth, growWidth, shrinkHeight, growHeight, select } from '../data/boardSlice'
import Back from '../images/icons/back.png'
import Forward from '../images/icons/forward.png'
import Pause from '../images/icons/pause.png'
import Play from '../images/icons/play.png'
import { CHARACTORS } from "./Combatant";

const getTeamStats = (combatants, selected_position, dispatch) => {
    const teams = Object.values(CHARACTORS).reduce((teams, cha) => {
        teams[cha.team] = []
        return teams;
    }, {});

    Object.values(combatants).forEach(combatant => {
        teams[combatant.team].push(combatant);
    });

    const counts = Object.keys(teams).map(team => {
        const team_array = [];
        teams[team]
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, 10)
            .forEach((c, idx, subset) => {
                if (idx === 0) {
                    team_array.push(<text key={"["}>{"[ "}</text>);
                }

                team_array.push(
                    <text 
                        key={`${c.id}`}
                        className={selected_position === c.position ? "Selected" : ""} 
                        onClick={() => {dispatch(select({position: c.position, follow_combatant: true}))}}
                    >
                        {`${c.immortal ? Infinity : c.fitness}`}
                    </text>
                );

                if (idx < teams[team].length - 1) {
                    team_array.push(<text key={`${idx}','`}>{', '}</text>);
                }

                if (idx === teams[team].length - 1) {
                    team_array.push(<text key={"]"}>{" ]"}</text>);
                } else if (idx === subset.length - 1) {
                    team_array.push(<text key={"...]"}>{ " ... ]"}</text>);
                }
            });
        return (
            <view key={team} className={'Team_group'}>
                <text className={'Label'}>{`${team}`}</text><text>{` (${teams[team].length}):`}</text>
                <view className={classNames("Data_row", "Team", "Clickable")}>
                    {teams[team].length < 1 ? 
                        (<text>{"[ ]"}</text>) : 
                        team_array
                    }
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

const Dashboard = ({onReset}) => {
    const ticker = useSelector((state) => state.ticker);
    const board = useSelector((state) => state.board);
    const dispatch = useDispatch()
    const teamStats = getTeamStats(board.combatants, board.selected_position, dispatch);
   
    const speed_section = (
        <view className="Control_container">
            <text style={{alignSelf: 'center'}}>{`Speed: ${ticker.tick_speed}`}</text>
            <view className="Speed_buttons_container">
                <button className="Clickable" onClick={() => {
                    dispatch(slowDown());
                }}>
                    <img className="Speed_button" alt="Back" src={Back} />
                </button>
                <button className="Clickable" onClick={() => {
                    dispatch(pauseUnpause());
                }}>
                    <img 
                        className="Speed_button" 
                        alt={ticker.tick_speed === 0 ? "Play" : "Pause"} 
                        src={ticker.tick_speed === 0 ? Play : Pause} 
                    />
                </button>
                <button className="Clickable" onClick={() => {
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
                <button className="Clickable" onClick={() => dispatch(shrinkWidth())}>
                    <text>{"<"}</text>
                </button>
                <text>{`Width: ${board.width}`}</text>
                <button className="Clickable" onClick={() => dispatch(growWidth())}>
                    <text>{">"}</text>
                </button>
            </view> 
            <view>
                <button className="Clickable" onClick={() => dispatch(shrinkHeight())}>
                    <text>{"<"}</text>
                </button>
                <text>{`Height: ${board.height}`}</text>
                <button className="Clickable" onClick={() => dispatch(growHeight())}>
                    <text>{">"}</text>
                </button>
            </view> 
        </>
    );

    return (
        <view className={'Dashboard'}>
            <view className="Control_container">
                <button 
                    className={classNames("Update_button", "Clickable")} 
                    onClick={() => onReset()
                }>
                    <text>{"Restart"}</text>
                </button>
                {speed_section}
                {resize_section}
            </view>
            <view>
                <view className={'Row'}>
                    <view className={'Row'}>
                        <text className={'Label'}>{'Game:'}</text>
                        <text className="Data_row">{board.game_count}</text>
                    </view>
                    <view className={classNames('Row', 'Count_item')}>
                        <text className={'Label'}>{'Tick:'}</text>
                        <text className="Data_row">{ticker.tick}</text>
                    </view>
                    <view className={classNames('Row', 'Count_item')}>
                        <text className={'Label'}>{`Combatants:`}</text>
                        <text className="Data_row">{`${Object.keys(board.combatants).length}`}</text>
                    </view>
                    <view className={classNames('Row', 'Count_item')}>
                        <text className={'Label'}>{`Births:`}</text>
                        <text className="Data_row">{`${board.births}`}</text>
                    </view>
                    <view className={classNames('Row', 'Count_item')}>
                        <text className={'Label'}>{`Deaths:`}</text>
                        <text className="Data_row">{`${board.deaths}`}</text>
                    </view>
                </view>
                {teamStats}
            </view>
        </view>
    )
};

export default Dashboard;