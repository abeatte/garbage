import React from 'react';
import { connect } from 'react-redux'
import { select, setShowSettings } from '../data/boardSlice';
import { HudDisplayMode, setIsHudActionable, setScreenSize } from '../data/hudSlice';
import { AppDispatch, AppState } from '../data/store';
import Arena from './Arena';
import Hud from './Hud';

class Game extends React.Component<AppState & DispatchProps> {
    
    handleWindowWidthResize = (
        setScreenSize: (dimens: {width: number, height: number}) => void, 
        dimens: {innerWidth: number, innerHeight: number}
    ) => {
        setScreenSize({width: dimens.innerWidth, height: dimens.innerHeight});
    }

    escFunction =  (event: { key: string; }) => {
        if (event.key === "Escape") {
            // close settings panel first, if it is open. 
            if (this.props.board.show_settings) {
                this.props.setNotShowSettings();
            } else {
                this.props.select();
                this.props.setHudIsNotActionable();
                this.props.setNotShowSettings();
            }
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.escFunction, false);
        this.handleWindowWidthResize(this.props.setScreenSize, window);
        window.addEventListener(
            'resize', 
            () => this.handleWindowWidthResize(this.props.setScreenSize, window)
        );
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.escFunction, false);
        window.removeEventListener('resize', () => this.handleWindowWidthResize);
    } 

    render() {
        switch(this.props.hud.hudDisplayMode) {
            case HudDisplayMode.FULL_SCREEN:
                return (
                    <>
                        <Hud/>
                    </>
                );
            case HudDisplayMode.GONE:
                return (
                    <>
                        <Arena/>
                    </>
                );
            case HudDisplayMode.SIDE_PANEL:
            default:
                return (
                    <>
                        <Arena/>
                        <Hud/>
                    </>
                );
        }
    }
}

function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud, 
    };
}

interface DispatchProps {
    select: () => void,
    setHudIsNotActionable: () => void,
    setNotShowSettings: () => void,
    setScreenSize: (dimens: {width: number, height: number}) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        select: () => dispatch(select({})),
        setHudIsNotActionable: () => dispatch(setIsHudActionable(false)),
        setNotShowSettings: () => dispatch(setShowSettings(false)),
        setScreenSize: (dimens: {width: number, height: number}) => 
            dispatch(setScreenSize({width: dimens.width, height: dimens.height}))
    }
  }
  
export default connect(mapStateToProps, mapDispatchToProps)(Game);
