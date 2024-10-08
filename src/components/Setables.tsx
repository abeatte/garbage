import '../css/Setables.css'
import classNames from "classnames";
import React, { useState } from "react";
import Analytics from "../analytics";
import { shrinkWidth, growWidth, shrinkHeight, growHeight, MovementLogic, setInitialNumCombatants, setMap, setMovementLogic, toggleShowRealTileImages, toggleShowTilePotentials, toggleUseGenders, setGameMode, GameMode } from "../data/slices/boardSlice";
import { useSelector, useDispatch } from "react-redux";
import Maps from "../data/Map";
import { speedChange, MAX_TICK_SPEED, DEFAULT_TICK_SPEED } from "../data/slices/tickerSlice";
import { AppState } from "../data/store";
import { faPlay, faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Setables = (props: { onReset?: () => void, onPlay?: () => void }) => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch()

    const [super_speed, setSuperSpeed] = useState(
        ticker.tick_speed === MAX_TICK_SPEED || (ticker.tick_speed === 0 && ticker.prev_tick_speed === MAX_TICK_SPEED));

    const play_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: Play');
                    props.onPlay && props.onPlay()
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={faPlay}
                    color='dark'
                    size='lg'
                    style={{
                        alignSelf: 'center',
                        margin: ticker.tick_speed > 0 ? '4px 1px 4px 1px' : '4px 0px 4px 0px'
                    }}
                />
            </button>
        </div>
    );

    const restart_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: reset');
                    props.onReset && props.onReset()
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={faRotate}
                    color='dark'
                    size='lg'
                    style={{
                        alignSelf: 'center',
                        margin: ticker.tick_speed > 0 ? '4px 1px 4px 1px' : '4px 0px 4px 0px'
                    }}
                />
            </button>
        </div>
    );

    const resize_section = (
        <div style={{ width: "182px" }}>
            <div className="Speed_buttons_container">
                <button className={classNames('Clickable', 'Button')} onClick={() => {
                    Analytics.logEvent('button_click: Shrink Width');
                    dispatch(shrinkWidth());
                }}>
                    <span>{"<"}</span>
                </button>
                <span className={classNames('Label', 'Centered')}>{`Width`}</span>
                <button className={classNames('Clickable', 'Button')} onClick={() => {
                    Analytics.logEvent('button_click: Grow Width');
                    dispatch(growWidth());
                }}>
                    <span>{">"}</span>
                </button>
            </div>
            <div className="Speed_buttons_container">
                <button className={classNames('Clickable', 'Button')} onClick={() => {
                    Analytics.logEvent('button_click: Shrink Height');
                    dispatch(shrinkHeight());
                }}>
                    <span>{"<"}</span>
                </button>
                <span className={classNames('Label', 'Centered')}>{`Height`}</span>
                <button className={classNames('Clickable', 'Button')} onClick={() => {
                    Analytics.logEvent('button_click: Grow Height');
                    dispatch(growHeight());
                }}>
                    <span>{">"}</span>
                </button>
            </div>
        </div>
    );

    const game_section = (
        <>
            <div className={classNames('Checkbox_container')}>
                <input
                    className={classNames('Clickable', 'Checkbox')}
                    type="checkbox"
                    checked={super_speed}
                    onChange={(input) => {
                        Analytics.logEvent(`button_click: Super Speed ${input.target.checked ? 'Checked' : 'Unchecked'}`);
                        setSuperSpeed(input.target.checked)
                        dispatch(speedChange({
                            value: input.target.checked ? MAX_TICK_SPEED : DEFAULT_TICK_SPEED, respectPause: true
                        }));
                    }}
                />
                <span className={'Label'}>{'Use Super Speed'}</span>
            </div>
            <div style={{ marginTop: "4px" }}>
                <span className={'Label'}>{'Game Mode: '}</span>
                <select
                    className={classNames('Dropdown_selector', 'Clickable')}
                    value={board.game_mode}
                    onChange={(input) => {
                        Analytics.logEvent(`input_changed: Game_mode -> ${input.target.value}`);
                        dispatch(setGameMode(input.target.value as GameMode));
                    }}>
                    {Object.values(GameMode).map(m => (<option key={m}>{m}</option>))}
                </select>
            </div>
        </>
    );

    const combatants_section = (
        <>

            <div style={{ marginTop: "4px" }}>
                <span className={'Label'}>{'Combatants: '}</span>
                <input
                    style={{ width: "48px" }}
                    type={"number"}
                    onChange={(input) => {
                        Analytics.logEvent(`input_changed: Initial Combatant Count ${input.target.value}`);
                        dispatch(setInitialNumCombatants(parseInt(input.target.value)));
                    }}
                    value={board.initial_num_combatants} />
            </div>
            <div className={classNames('Checkbox_container')}>
                <input
                    className={classNames('Clickable', 'Checkbox')}
                    type="checkbox"
                    checked={board.use_genders}
                    onChange={(input) => {
                        Analytics.logEvent(`button_click: Use Genders ${board.use_genders ? 'Unchecked' : 'Checked'}`);
                        dispatch(toggleUseGenders());
                    }}
                />
                <span className={'Label'}>{'Set Genders'}</span>
            </div>
            <div style={{ marginTop: "4px" }}>
                <span className={'Label'}>{'Movement: '}</span>
                <select
                    className={classNames('Dropdown_selector', 'Clickable')}
                    value={board.movement_logic}
                    onChange={(input) => {
                        Analytics.logEvent(`input_changed: Movement Logic -> ${input.target.value}`);
                        dispatch(setMovementLogic(input.target.value as unknown as MovementLogic));
                    }}
                >
                    {Object.values(MovementLogic).map(l => (<option key={l.toString()}>{l}</option>))}
                </select>
            </div>
        </>
    );

    const map_section = (
        <>
            <div style={{ marginTop: "4px" }}>
                <span className={'Label'}>{'Map: '}</span>
                <select
                    className={classNames('Dropdown_selector', 'Clickable')}
                    value={board.map}
                    onChange={(input) => {
                        Analytics.logEvent(`input_changed: Map -> ${input.target.value}`);
                        dispatch(setMap(input.target.value));
                    }}>
                    {Object.values(Maps).map(m => (<option key={m.name.toString()}>{m.name}</option>))}
                </select>
            </div>
            <div className={classNames('Checkbox_container')}>
                <input
                    className={classNames('Clickable', 'Checkbox')}
                    type="checkbox"
                    checked={board.show_real_tile_images}
                    onChange={(input) => {
                        Analytics.logEvent(`button_click: Show Real Tile Images ${board.show_real_tile_images ? 'Unchecked' : 'Checked'}`);
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
                        Analytics.logEvent(`button_click: Show Tile Potentials ${board.show_tile_potentials ? 'Unchecked' : 'Checked'}`);
                        dispatch(toggleShowTilePotentials());
                    }}
                />
                <span className={'Label'}>{'Show Tile Value'}</span>
            </div>
        </>
    );

    const settables_section = (
        <>
            {game_section}
            {map_section}
            {combatants_section}
        </>
    );

    return (
        <div className="Setables">
            <div className='Game_section'>
                {play_button}
                {restart_button}
            </div>

            {resize_section}
            {settables_section}
        </div>
    );
}

export default Setables;
