import React from "react";
import '../css/Dashboard.css'
import classNames from "classnames";
import { useSelector, useDispatch } from 'react-redux'
import { MAX_TICK_SPEED, speedChange } from '../data/tickerSlice'
import { shrinkWidth, growWidth, shrinkHeight, growHeight, select, Combatants, toggleShowTilePotentials, setMovementLogic, MovementLogic, toggleUseGenders, setInitialNumCombatants, setShowSettings } from '../data/boardSlice'
import { setIsHudActionable } from "../data/hudSlice";
import { AppDispatch, AppState } from "../data/store";
import CombatantModel, { Character } from "../models/CombatantModel";
import { useState } from "react";
import { useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown'
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp'

const getTeamStats = (combatants: Combatants, selected_position: number | undefined, dispatch: AppDispatch) => {
    const teams = Object.values(Character).reduce((teams, cha) => {
        teams[cha] = []
        return teams;
    }, {} as {[key in Character]: CombatantModel[]});

    Object.values(combatants).forEach(combatant => {
        teams[combatant.team].push(combatant);
    });

    const counts = Object.keys(teams).map(t => {
        const team = t as Character
        const team_array = [] as JSX.Element[];
        teams[team]
            .sort((a, b) => {
                if (b.immortal) {
                    return 1;
                } else if (a.immortal) {
                    return -1;
                } else {
                    return b.fitness - a.fitness
                }
            })
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
            <div key={team} className={'Team_group'}>
                <span className={'Label'}>{`${team}`}</span><span>{` (${teams[team].length}):`}</span>
                <div className={classNames("Data_row", "Team", "Clickable")}>
                    {teams[team].length < 1 ? 
                        (<span>{"[ ]"}</span>) : 
                        team_array
                    }
                </div>
            </div>
        );
    }).sort((a, b) => (a.key as string).localeCompare(b.key as string));

    return (
        <div className={'Stat_group'}>
            <div>{counts}</div>
        </div>
    );
};

const Dashboard = (args: {onReset: () => void}) => {
    const {onReset} = args
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch()
    const teamStats = getTeamStats(board.combatants, board.selected_position, dispatch);

    const [speed_setting, setSpeedSetting] = useState(ticker.tick_speed);
    useEffect(() => {
        // this keeps tick_speed in sync with pause (space bar) events. 
        setSpeedSetting(ticker.tick_speed);
    }, [ticker.tick_speed]);

    const speedChangeKeyCapture = (input: { target: HTMLInputElement }) => {
        dispatch(speedChange(parseInt((input.target as HTMLInputElement).value)))
    };

    const [show_settings, _setShowSettings] = useState(board.show_settings);
    useEffect(() => {
        // this lets us handle things like "esc" from the Game
        _setShowSettings(board.show_settings);
    }, [board.show_settings]);

    const show_settings_button = (
        <div style={{margin: "4px 8px 0px 0px"}}>
            <button 
                className={classNames('Clickable', 'Button', 'Restart')} 
                onClick={() => dispatch(setShowSettings(!board.show_settings))
            }>
                <FontAwesomeIcon 
                    className="Clickable" 
                    icon={show_settings ? faArrowUp : faArrowDown} 
                    color='dark' 
                    size='lg' 
                    style={{alignSelf: 'center', margin: '4px 0px 4px 0px'}}
                />
            </button>
        </div>
    );
    const speed_section = (
        <div 
            className={classNames("Row", "Settings_panel")} 
            style={{maxHeight: "50px", width: "182px"}}
        >
            {show_settings_button}
            <div style={{flexDirection: 'column'}} className="Speed_buttons_container">
                <span  className="Label" style={{alignSelf: 'center'}}>{`Speed`}</span>
                <div className="Slider_container">
                    <input 
                        style={{backgroundSize: `${speed_setting/MAX_TICK_SPEED*100}% 100%`}}
                        type="range" 
                        className="Slider" 
                        min="0" 
                        max={MAX_TICK_SPEED} 
                        value={speed_setting}
                        // @ts-ignore
                        onKeyUpCapture={speedChangeKeyCapture}
                        // @ts-ignore
                        onClickCapture={speedChangeKeyCapture}
                        // @ts-ignore
                        onTouchEndCapture={speedChangeKeyCapture}
                        onChange={(input) => {
                            setSpeedSetting(parseInt(input.target.value));
                        }}
                    />
                </div>
            </div>
        </div>
    );
    const resize_section = (
        <div style={{width: "182px"}}>
            <div className="Speed_buttons_container">
                <button className={classNames('Clickable', 'Button')} onClick={() => dispatch(shrinkWidth())}>
                    <span>{"<"}</span>
                </button>
                <span className={classNames('Label', 'Centered')}>{`Width`}</span>
                <button className={classNames('Clickable', 'Button')} onClick={() => dispatch(growWidth())}>
                    <span>{">"}</span>
                </button>
            </div> 
            <div className="Speed_buttons_container">
                <button className={classNames('Clickable', 'Button')} onClick={() => dispatch(shrinkHeight())}>
                    <span>{"<"}</span>
                </button>
                <span className={classNames('Label', 'Centered')}>{`Height`}</span>
                <button className={classNames('Clickable', 'Button')} onClick={() => dispatch(growHeight())}>
                    <span>{">"}</span>
                </button>
            </div> 
        </div>
    );

    const settables_section = (
        <>
            <div className={classNames('Checkbox_container')}>
                <input 
                    className={classNames('Clickable', 'Checkbox')} 
                    type="checkbox" 
                    checked={board.use_genders}
                    onChange={(input) => {
                        dispatch(toggleUseGenders());
                    }}
                />
                <span className={'Label'}>{'Set Genders'}</span>
            </div>
            <div className={classNames('Checkbox_container')}>
                <input 
                    className={classNames('Clickable', 'Checkbox')} 
                    type="checkbox" 
                    checked={board.show_tile_potentials}
                    onChange={(input) => {
                        dispatch(toggleShowTilePotentials());
                    }}
                />
                <span className={'Label'}>{'Show Tile Value'}</span>
            </div>
            <div>
                <span className={'Label'}>{'Initial Combatant Count: '}</span>
                <input
                    style={{width: "48px"}} 
                    type={"number"} 
                    onChange={(input) => dispatch(setInitialNumCombatants(parseInt(input.target.value)))} 
                    value={board.initial_num_combatants}/>
            </div>
            <div>
                <span className={'Label'}>{'Movement: '}</span>
                <select
                    className={classNames('Movement_selector', 'Clickable')}
                    value={board.movement_logic}
                    onChange={(input) => dispatch(setMovementLogic(input.target.value as unknown as MovementLogic))}
                    >
                        {Object.values(MovementLogic).map(l => (<option key={l.toString()}>{l}</option>))}
                </select>
            </div>
        </>
    );

    const restart_button = (
        <button 
        style={{width: "182px"}}
            className={classNames('Clickable', 'Button', 'Restart')} 
            onClick={() => onReset()
        }>
            <span>{"Restart"}</span>
        </button>
    );
    const settings_section = (
        <div 
            className={classNames("Control_container", "Settings_panel")} 
            style={{position: "absolute", marginTop: "-66px", zIndex: "999", boxShadow: "2px 2px 10px 2px"}}
        >
            {speed_section}
            {restart_button}
            {resize_section}
            {settables_section}
        </div>
    );

    return (
        <div className={'Dashboard'}>
            <div className={classNames({"Settings_panel_expanded" : show_settings})}>
                {speed_section}
                {show_settings && settings_section}
            </div>
            <div className="Stats_panel">
                <div className={'Row_group'}>
                    <div className={'Row'}>
                        <span className={'Label'}>{'Game:'}</span>
                        <span className="Data_row">{board.game_count}</span>
                    </div>
                    <div className={classNames('Row')}>
                        <span className={'Label'}>{'Year:'}</span>
                        <span className="Data_row">{ticker.tick}</span>
                    </div>
                    <div className={classNames('Row')}>
                        <span className={'Label'}>{`Combatants:`}</span>
                        <span className="Data_row">{`${board.global_combatant_stats.num_combatants}`}</span>
                    </div>
                    <div className={classNames('Row')}>
                        <span className={'Label'}>{`Births:`}</span>
                        <span className="Data_row">{`${board.global_combatant_stats.births}`}</span>
                    </div>
                    <div className={classNames('Row')}>
                        <span className={'Label'}>{`Deaths:`}</span>
                        <span className="Data_row">{`${board.global_combatant_stats.deaths}`}</span>
                    </div>
                </div>
                {teamStats}
            </div>
        </div>
    )
};

export default Dashboard;