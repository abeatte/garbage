import React from "react";import classNames from "classnames";
import { AppState } from "../data/store";
import { useState } from "react";
import { useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector, useDispatch } from 'react-redux'
import { DEFAULT_TICK_SPEED, MAX_TICK_SPEED, pauseUnpause, speedChange } from '../data/tickerSlice'
import { growHeight, growWidth, MovementLogic, setInitialNumCombatants, setMovementLogic, setShowSettings, shrinkHeight, shrinkWidth, toggleShowRealTileImages, toggleShowTilePotentials, toggleUseGenders } from "../data/boardSlice";
import { faListDots, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";

const Settings = ({onReset}: {onReset: () => void}) => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch()

    const [show_settings, _setShowSettings] = useState(board.show_settings);
    useEffect(() => {
        // this lets us handle things like "esc" from the Game
        _setShowSettings(board.show_settings);
    }, [board.show_settings]);

    const [super_speed, setSuperSpeed] = useState(
        ticker.tick_speed === MAX_TICK_SPEED || (ticker.tick_speed === 0 && ticker.prev_tick_speed === MAX_TICK_SPEED));

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
                        checked={super_speed}
                        onChange={(input) => {
                            setSuperSpeed(input.target.checked)
                            dispatch(speedChange({
                                value: input.target.checked ? MAX_TICK_SPEED: DEFAULT_TICK_SPEED, respectPause: true
                            }));
                        }}
                    />
                    <span className={'Label'}>{'Use Super Speed'}</span>
            </div>
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
                    checked={board.show_real_tile_images}
                    onChange={(input) => {
                        dispatch(toggleShowRealTileImages());
                    }}
                />
                <span className={'Label'}>{'Show Real Tiles'}</span>
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

    const show_settings_button = (
        <div style={{margin: "0px 8px 0px 0px"}}>
            <button 
                className={classNames('Clickable', 'Button')} 
                onClick={() => dispatch(setShowSettings(!board.show_settings))
            }>
                <FontAwesomeIcon 
                    className="Clickable" 
                    icon={faListDots} 
                    color='dark' 
                    size='lg' 
                    style={{alignSelf: 'center', margin: '4px 0px 4px 0px'}}
                />
            </button>
        </div>
    );
    
    const pause_play_button = (
        <div style={{margin: "0px 8px 0px 0px"}}>
            <button 
                className={classNames('Clickable', 'Button')} 
                onClick={() => dispatch(pauseUnpause())
            }>
                <FontAwesomeIcon 
                    className="Clickable" 
                    icon={ticker.tick_speed > 0 ? faPause : faPlay} 
                    color='dark' 
                    size='lg' 
                    style={{
                        alignSelf: 'center', 
                        margin: ticker.tick_speed > 0 ? '4px 1px 4px 1px' : '4px 0px 4px 0px'}}
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
            {pause_play_button}
        </div>
    );
    const settings_section = (
        <div 
                className={classNames("Control_container", "Settings_panel")} 
                style={{position: "absolute", marginTop: "-58px", zIndex: "999", boxShadow: "2px 2px 10px 2px"}}
            >
                {speed_section}
                {restart_button}
                {resize_section}
                {settables_section}
            </div>
    );

    return (
        <div className={classNames({"Settings_panel_expanded" : show_settings})}>
            {speed_section}
            {show_settings && settings_section}
        </div>
    );
};

export default Settings;
