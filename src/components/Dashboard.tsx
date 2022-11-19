import React from "react";
import '../css/Dashboard.css'
import classNames from "classnames";
import { useSelector, useDispatch } from 'react-redux'
import { speedUp, slowDown, pauseUnpause } from '../data/tickerSlice'
import { shrinkWidth, growWidth, shrinkHeight, growHeight, select, Combatants, toggleShowTilePotentials } from '../data/boardSlice'
import { Character } from "./Combatant";
import { setIsHudActionable } from "../data/hudSlice";
// @ts-ignore
import Back from '../images/icons/back.png'
// @ts-ignore
import Forward from '../images/icons/forward.png'
// @ts-ignore
import Pause from '../images/icons/pause.png'
// @ts-ignore
import Play from '../images/icons/play.png'
import { AppDispatch, AppState } from "../data/store";
import CombatantModel from "../models/CombatantModel";

const getTeamStats = (combatants: Combatants, selected_position: number | undefined, dispatch: AppDispatch) => {
    const teams = Object.values(Character).reduce((teams, cha) => {
        teams[cha] = []
        return teams;
    }, {} as {[key in Character]: CombatantModel[]});

    Object.values(combatants).forEach(combatant => {
        teams[combatant.team].push(combatant);
    });

    const counts = Object.keys(teams).map(t => {
        const team = t as keyof typeof Character
        const team_array = [] as JSX.Element[];
        teams[team]
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, 10)
            .forEach((c: CombatantModel, idx: number, subset: CombatantModel[]) => {
                if (idx === 0) {
                    team_array.push(<span key={"["}>{"[ "}</span>);
                }

                team_array.push(
                    <span 
                        key={`${c.id}`}
                        className={selected_position === c.position ? "Selected" : ""} 
                        onClick={() => {
                            dispatch(select({position: c.position, follow_combatant: true}));
                            dispatch(setIsHudActionable(true));
                        }}
                    >
                        {`${c.immortal ? Infinity : c.fitness}`}
                    </span>
                );

                if (idx < teams[team].length - 1) {
                    team_array.push(<span key={`${idx}','`}>{', '}</span>);
                }

                if (idx === teams[team].length - 1) {
                    team_array.push(<span key={"]"}>{" ]"}</span>);
                } else if (idx === subset.length - 1) {
                    team_array.push(<span key={"...]"}>{ " ... ]"}</span>);
                }
            });
        return (
            <view key={team} className={'Team_group'}>
                <span className={'Label'}>{`${team}`}</span><span>{` (${teams[team].length}):`}</span>
                <view className={classNames("Data_row", "Team", "Clickable")}>
                    {teams[team].length < 1 ? 
                        (<span>{"[ ]"}</span>) : 
                        team_array
                    }
                </view>
            </view>
        );
    }).sort((a, b) => (a.key as string).localeCompare(b.key as string));

    return (
        <view className={'Stat_group'}>
            <view>{counts}</view>
        </view>
    );
};

const Dashboard = (args: {onReset: () => void}) => {
    const {onReset} = args
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch()
    const teamStats = getTeamStats(board.combatants, board.selected_position, dispatch);
   
    const speed_section = (
        <view className="Control_container">
            <span  className="Label" style={{alignSelf: 'center'}}>{`Speed: ${ticker.tick_speed}`}</span>
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
                    <span>{"<"}</span>
                </button>
                <span className="Label">{`Width: ${board.width}`}</span>
                <button className="Clickable" onClick={() => dispatch(growWidth())}>
                    <span>{">"}</span>
                </button>
            </view> 
            <view>
                <button className="Clickable" onClick={() => dispatch(shrinkHeight())}>
                    <span>{"<"}</span>
                </button>
                <span className="Label">{`Height: ${board.height}`}</span>
                <button className="Clickable" onClick={() => dispatch(growHeight())}>
                    <span>{">"}</span>
                </button>
            </view> 
            <view style={{marginTop: "4px"}}>
                <input 
                    className={classNames('Clickable', 'Checkbox')} 
                    type="checkbox" 
                    checked={board.show_tile_potentials}
                    onChange={(input) => {
                        dispatch(toggleShowTilePotentials());
                    }}
                />
                <span className={'Label'}>{'Show Tile Potential'}</span>
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
                    <span>{"Restart"}</span>
                </button>
                {speed_section}
                {resize_section}
            </view>
            <view style={{flexGrow: 1}}>
                <view className={'Row_group'}>
                    <view className={'Row'}>
                        <span className={'Label'}>{'Game:'}</span>
                        <span className="Data_row">{board.game_count}</span>
                    </view>
                    <view className={classNames('Row')}>
                        <span className={'Label'}>{'Year:'}</span>
                        <span className="Data_row">{ticker.tick}</span>
                    </view>
                    <view className={classNames('Row')}>
                        <span className={'Label'}>{`Combatants:`}</span>
                        <span className="Data_row">{`${Object.keys(board.combatants).length}`}</span>
                    </view>
                    <view className={classNames('Row')}>
                        <span className={'Label'}>{`Births:`}</span>
                        <span className="Data_row">{`${board.global_combatant_stats.births}`}</span>
                    </view>
                    <view className={classNames('Row')}>
                        <span className={'Label'}>{`Deaths:`}</span>
                        <span className="Data_row">{`${board.global_combatant_stats.deaths}`}</span>
                    </view>
                </view>
                {teamStats}
            </view>
        </view>
    )
};

export default Dashboard;