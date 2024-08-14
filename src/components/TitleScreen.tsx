import React from "react";
import { AppDispatch, AppState } from "../data/store";
import Game from "./Game";
import { connect } from "react-redux";
import Analytics from "../analytics";
import { GameMode, reset, setGameMode } from "../data/boardSlice";
import '../css/TitleScreen.css';

class TitleScreen extends React.Component<AppState & DispatchProps> {
    keysFunction =  (event: { key: string; }) => {
        const key = event.key.toUpperCase();
        if (key === "A") {
            Analytics.logEvent('key_pressed: A');
            this.props.setGameMode(GameMode.Adventure);
            document.removeEventListener("keydown", this.keysFunction, false);
        } else if (key === "G") {
            Analytics.logEvent('key_pressed: G');
            this.props.setGameMode(GameMode.God);
            document.removeEventListener("keydown", this.keysFunction, false);
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keysFunction, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keysFunction, false);
    } 

    render() {
        
        let screen;
        switch(this.props.board.game_mode) {
            /* eslint-disable no-fallthrough */
            case GameMode.Adventure:
                // fall-through
            case GameMode.God:
                screen = (<Game/>);
                break;
            case GameMode.Title:
                // fall-through
            default:
                screen = (
                    <div className="Title">
                        <h1>"Welcome to Garbage"</h1>
                        <h3>"Will you be playing in (A)dventure Mode or (G)od Mode?"</h3>
                    </div>
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

interface DispatchProps {
    setGameMode: (gameMode: GameMode) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        setGameMode: (gameMode: GameMode) => {
            dispatch(setGameMode(gameMode));
            dispatch(reset());
        }
    }
  }

export default connect(mapStateToProps, mapDispatchToProps)(TitleScreen);