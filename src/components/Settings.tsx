import React from "react"; import classNames from "classnames";
import { AppState } from "../data/store";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSelector, useDispatch } from 'react-redux'
import { faStop } from "@fortawesome/free-solid-svg-icons";
import Analytics from "../analytics";
import { TICK_SPEED_MAX_STEPS, speedChange } from "../data/slices/tickerSlice";
import { stopGame } from "../data/slices/boardSlice";

const Settings = () => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const dispatch = useDispatch()

    const speed_slider = (
        <div className="Speed_slider_container">
            <span
                className="Speed_slider_label Clickable"
                onClick={() => {
                    Analytics.logEvent('button_click: Pause');
                    dispatch(speedChange(0));
                }}
            >⏸</span>
            <input
                type="range"
                className="Speed_slider"
                min={0}
                max={TICK_SPEED_MAX_STEPS}
                step={1}
                value={ticker.tick_speed}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    Analytics.logEvent(`slider_change: tick_speed ${val}`);
                    dispatch(speedChange(val));
                }}
            />
            <span
                className="Speed_slider_label Clickable"
                onClick={() => {
                    Analytics.logEvent('button_click: Max Speed');
                    dispatch(speedChange(TICK_SPEED_MAX_STEPS));
                }}
            >▶▶</span>
        </div>
    );

    const stop_button = (
        <button
            className={classNames('Clickable', 'Button')}
            style={{ marginRight: "8px" }}
            onClick={() => {
                Analytics.logEvent('button_click: Stop');
                dispatch(stopGame());
            }}>
            <FontAwesomeIcon
                className="Clickable"
                icon={faStop}
                color='dark'
                size='lg'
                style={{ alignSelf: 'center', margin: '4px 1px 4px 1px' }}
            />
        </button>
    );

    return (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100%", padding: "0px 8px" }}>
            {stop_button}
            {speed_slider}
        </div>
    );
};

export default Settings;
