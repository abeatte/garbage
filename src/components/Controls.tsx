import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Analytics from "../analytics";
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { ArrowKey, togglePlayerHighlight } from "../data/slices/boardSlice";
import { AppState } from "../data/store";

const Controls = (props: { playerMovementFunction: (direction: ArrowKey) => boolean, playerHighlight: boolean }) => {
    const board = useSelector((state: AppState) => state.board);
    const dispatch = useDispatch();

    const targetHighlightColor = props.playerHighlight ? 'white' : undefined;

    return (
        <div className={classNames("Flyout_panel", "Right", "Bottom")}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', marginRight: '8px', marginTop: '8px' }}>
                    <FontAwesomeIcon
                        id="arrow_up"
                        onClick={() => {
                            if (props.playerMovementFunction(ArrowKey.ARROWUP)) {
                                Analytics.logEvent('button_clicked: Controls Flyout up arrow');
                            }
                        }}
                        icon={faArrowUp}
                        color='dark'
                        size='lg'
                        style={{ alignSelf: 'center', margin: '0px 0px 8px 8px' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{ display: 'flex', marginRight: '16px', marginTop: '8px' }}>
                        <FontAwesomeIcon
                            id="arrow_left"
                            onClick={() => {
                                Analytics.logEvent('button_clicked: Controls Flyout left arrow');
                                props.playerMovementFunction(ArrowKey.ARROWLEFT);
                            }}
                            icon={faArrowLeft}
                            color='dark'
                            size='lg'
                            style={{ alignSelf: 'center', margin: '0px 0px 8px 8px' }}
                        />
                    </div>
                    <div style={{
                        display: 'flex',
                        backgroundColor: targetHighlightColor,
                        paddingRight: '8px',
                        marginRight: '-8px',
                        marginLeft: '2px',
                        paddingTop: '9px'
                    }}>
                        <FontAwesomeIcon
                            id="target"
                            onClick={() => {
                                Analytics.logEvent('button_clicked: Controls Flyout target');
                                if (board.player_highlight_count === 0) {
                                    dispatch(togglePlayerHighlight());
                                }
                            }}
                            icon={faLocationCrosshairs}
                            color='dark'
                            size='lg'
                            style={{ alignSelf: 'center', margin: '0px 0px 8px 8px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', marginRight: '8px', marginLeft: '18px', marginTop: '8px' }}>
                        <FontAwesomeIcon
                            id="arrow_right"
                            onClick={() => {
                                Analytics.logEvent('button_clicked: Controls Flyout right arrow');
                                props.playerMovementFunction(ArrowKey.ARROWRIGHT);
                            }}
                            icon={faArrowRight}
                            color='dark'
                            size='lg'
                            style={{ alignSelf: 'center', margin: '0px 0px 8px 8px' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', marginRight: '8px', marginTop: '8px' }}>
                    <FontAwesomeIcon
                        id="arrow_down"
                        onClick={() => {
                            Analytics.logEvent('button_clicked: Controls Flyout down arrow');
                            props.playerMovementFunction(ArrowKey.ARROWDOWN);
                        }}
                        icon={faArrowDown}
                        color='dark'
                        size='lg'
                        style={{ alignSelf: 'center', margin: '0px 0px 8px 8px' }}
                    />
                </div>
            </div>
        </div>
    )
}

export default Controls;
