import React from "react";
import { AppState } from "../data/store";
import { connect } from "react-redux";
import { GameMode } from "../data/slices/boardSlice";
import GameBoard from "./GameBoard";
import TitleScreen from "./TitleScreen";
import { mapStateToProps } from "../data/utils/ReactUtils";

/* eslint-disable no-fallthrough */

class Game extends React.Component<AppState> {
    render() {
        
        let screen;
        switch(this.props.board.game_mode) {
            case GameMode.Adventure:
                // fall-through
            case GameMode.God:
                screen = (<GameBoard/>);
                break;
            case GameMode.Title:
                // fall-through
            default:
                screen = (
                    <TitleScreen/>
                );
        }
        return screen;
    }
}

export default connect(mapStateToProps)(Game);
