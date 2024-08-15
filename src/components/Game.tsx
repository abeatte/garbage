import React from "react";
import { AppState } from "../data/store";
import { connect } from "react-redux";
import { GameMode } from "../data/boardSlice";
import GameBoard from "./GameBoard";
import TitleScreen from "./TitleScreen";

class Game extends React.Component<AppState> {
    render() {
        
        let screen;
        switch(this.props.board.game_mode) {
            /* eslint-disable no-fallthrough */
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

function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
        paintPalette: state.paintPalette,
    };
}

export default connect(mapStateToProps)(Game);