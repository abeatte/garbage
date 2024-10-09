import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Analytics from "../analytics";
import { faArrowDown, faArrowLeft, faArrowRight, faArrowUp, faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { togglePlayerHighlight } from "../data/slices/boardSlice";
import { AppState } from "../data/store";
import '../css/Controls.css';
import { PaintEntity } from "../data/slices/paintPaletteSlice";
import { Pointer } from "../models/PointerModel";
import { State } from "../models/CombatantModel";
import { ArrowKey } from "../data/utils/GameUtils";

const Controls = (props: { paintOnTile: (paint_args: { position: number, type: PaintEntity }) => void, playerMovementFunction: (direction: ArrowKey) => boolean, playerHighlight: boolean }) => {
    const board = useSelector((state: AppState) => state.board);
    const paintPalette = useSelector((state: AppState) => state.paintPalette);
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
                            if (board.player?.state !== State.Dead) {
                                const position = board.player?.position;
                                if (paintPalette.selected !== Pointer.Target && position) {
                                    props.paintOnTile({ position, type: paintPalette.selected });
                                }
                            }
                            if (board.player_highlight_count === 0) {
                                dispatch(togglePlayerHighlight());
                            }
                        }}>
                        <FontAwesomeIcon id="target" icon={faCrosshairs} color='dark' size='lg' />
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
