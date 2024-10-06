import React from "react"; import classNames from "classnames";
import { AppState } from "../data/store";
import { useState } from "react";
import { useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector, useDispatch } from 'react-redux'
import {
    setShowSettings,
} from "../data/slices/boardSlice";
import { faListDots, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import Analytics from "../analytics";
import Setables from "./Setables";
import { pauseUnpause } from "../data/slices/tickerSlice";

const Settings = (props: { showPause?: boolean, onReset?: () => void }) => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch()

    const [show_settings, _setShowSettings] = useState(board.show_settings);
    useEffect(() => {
        // this lets us handle things like "esc" from the Game
        _setShowSettings(board.show_settings);
    }, [board.show_settings]);

    const show_settings_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: Show Settings');
                    dispatch(setShowSettings(!board.show_settings));
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={faListDots}
                    color='dark'
                    size='lg'
                    style={{ alignSelf: 'center', margin: '4px 0px 4px 0px' }}
                />
            </button>
        </div>
    );

    const pause_play_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: Pause/Unpause');
                    dispatch(pauseUnpause());
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={ticker.tick_speed > 0 ? faPause : faPlay}
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

    const speed_section = (
        <div
            className={classNames("Row", "Settings_panel")}
            style={{ maxHeight: "50px" }}
        >
            {show_settings_button}
            {(props.showPause === undefined || props.showPause) && pause_play_button}
        </div>
    );
    const settings_section = (
        <div
            className={classNames("Control_container", "Settings_panel")}
            style={{ position: "absolute", marginTop: "-58px", zIndex: "999", boxShadow: "2px 2px 10px 2px" }}
        >
            {speed_section}
            <Setables onReset={props.onReset} />
        </div>
    );

    return (
        <div className={classNames({ "Settings_panel_expanded": show_settings })}
            style={{ width: "182px" }}>
            {speed_section}
            {show_settings && settings_section}
        </div>
    );
};

export default Settings;
