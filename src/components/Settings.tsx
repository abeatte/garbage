import React from "react"; import classNames from "classnames";
import { AppState } from "../data/store";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector, useDispatch } from 'react-redux'
import { faForward, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import Analytics from "../analytics";
import { DEFAULT_TICK_SPEED, MAX_TICK_SPEED, speedChange } from "../data/slices/tickerSlice";
import { stopGame } from "../data/slices/boardSlice";

const Settings = () => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const dispatch = useDispatch()

    const pause_speed_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: Pause/Unpause');
                    if (ticker.tick_speed === 0) {
                        dispatch(speedChange(DEFAULT_TICK_SPEED));
                    } else if (ticker.tick_speed === MAX_TICK_SPEED) {
                        dispatch(speedChange(0));
                    } else {
                        dispatch(speedChange(MAX_TICK_SPEED));
                    }
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={ticker.tick_speed === 0 ? faPlay : ticker.tick_speed === MAX_TICK_SPEED ? faPause : faForward}
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

    const stop_button = (
        <div style={{ margin: "0px 8px 0px 0px" }}>
            <button
                className={classNames('Clickable', 'Button')}
                onClick={() => {
                    Analytics.logEvent('button_click: Pause/Unpause');
                    dispatch(stopGame());
                }}>
                <FontAwesomeIcon
                    className="Clickable"
                    icon={faStop}
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

    return (
        <div
            style={{ width: "182px" }}>
            <div className={classNames("Row", "Settings_panel")} style={{ maxHeight: "50px" }}>
                {pause_speed_button}
                {stop_button}
            </div>
        </div>
    );
};

export default Settings;
