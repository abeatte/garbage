import React from 'react';
import '../css/TitleScreen.css';
import { AppDispatch, AppState } from '../data/store'; 
import { GameMode, reset, setGameMode } from '../data/boardSlice';
import Analytics from '../analytics';
import { connect } from 'react-redux';
import classNames from 'classnames';

const logo = require('../images/icon.png');

class TitleScreen extends React.Component<AppState & DispatchProps> {
    keysFunction =  (event: { key: string; }) => {
        const key = event.key.toUpperCase();
        if (key === "A") {
            Analytics.logEvent('key_pressed: A');
            this.props.setGameMode(GameMode.Adventure);
        } else if (key === "G") {
            Analytics.logEvent('key_pressed: G');
            this.props.setGameMode(GameMode.God);
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keysFunction, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keysFunction, false);
    } 
    
    render() {
        return (
            <div className="Title">
                <h1>Welcome to</h1>
                <img
                    className="Logo" 
                    src={logo}
                    alt='logo'
                />
                <h3>How will you be playing?</h3>
                <div className='Button_row'>
                    <button 
                        className={classNames('Clickable', 'Button')} 
                        onClick={() => this.props.setGameMode(GameMode.Adventure)}
                    >
                        (A)dventure Mode
                    </button>
                    <button 
                        className={classNames('Clickable', 'Button')}
                        onClick={() => this.props.setGameMode(GameMode.God)}
                    >
                        (G)od Mode
                    </button>
                </div>
            </div>
        );
    }
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

function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
        paintPalette: state.paintPalette,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleScreen);