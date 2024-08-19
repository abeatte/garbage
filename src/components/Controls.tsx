import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Analytics from "../analytics";
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { ArrowKey, togglePlayerHighlight } from "../data/slices/boardSlice";
import { AppState } from "../data/store";
import '../css/Controls.css';

const Controls = (props: { playerMovementFunction: (direction: ArrowKey) => boolean, playerHighlight: boolean }) => {
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch();

    const targetHighlightColor = props.playerHighlight ? 'white' : undefined;

    return (
        <div className={classNames("Flyout_panel", "Right", "Bottom")}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="Control_button"
                    onClick={() => {
                        if (props.playerMovementFunction(ArrowKey.ARROWUP)) {
                            Analytics.logEvent('button_clicked: Controls Flyout up arrow');
                        }
                    }}>
                    <FontAwesomeIcon id="arrow_up" icon={faArrowUp} color='dark' size='lg' />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div className="Control_button"
                        onClick={() => {
                            Analytics.logEvent('button_clicked: Controls Flyout left arrow');
                            props.playerMovementFunction(ArrowKey.ARROWLEFT);
                        }}>
                        <FontAwesomeIcon id="arrow_left" icon={faArrowLeft} color='dark' size='lg' />
                    </div>
                    <div className="Control_button" style={{ backgroundColor: targetHighlightColor }}
                        onClick={() => {
                            Analytics.logEvent('button_clicked: Controls Flyout target');
                            if (board.player_highlight_count === 0) {
                                dispatch(togglePlayerHighlight());
                            }
                        }}>
                        <FontAwesomeIcon id="target" icon={faLocationCrosshairs} color='dark' size='lg' />
                    </div>
                    <div className="Control_button"
                        onClick={() => {
                            Analytics.logEvent('button_clicked: Controls Flyout right arrow');
                            props.playerMovementFunction(ArrowKey.ARROWRIGHT);
                        }}>
                        <FontAwesomeIcon id="arrow_right" icon={faArrowRight} color='dark' size='lg' />
                    </div>
                </div>
                <div className="Control_button"
                    onClick={() => {
                        Analytics.logEvent('button_clicked: Controls Flyout down arrow');
                        props.playerMovementFunction(ArrowKey.ARROWDOWN);
                    }}>
                    <FontAwesomeIcon id="arrow_down" icon={faArrowDown} color='dark' size='lg' />
                </div>
            </div>
        </div>
    )
}

export default Controls;
