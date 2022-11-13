import React from 'react';
import { connect } from 'react-redux'
import { select } from '../data/boardSlice';
import { HUD_DISPLAY_MODE, setIsHudActionable, setScreenSize } from '../data/hudSlice';
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
            this.props.select();
            this.props.setHudIsNotActionable();
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
            case HUD_DISPLAY_MODE.FULL_SCREEN:
                return (
                    <>
                        <Hud/>
                    </>
                );
            case HUD_DISPLAY_MODE.GONE:
                return (
                    <>
                        <Arena/>
                    </>
                );
            case HUD_DISPLAY_MODE.SIDE_PANEL:
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
    setScreenSize: (dimens: {width: number, height: number}) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        select: () => dispatch(select({})),
        setHudIsNotActionable: () => dispatch(setIsHudActionable(false)),
        setScreenSize: (dimens: {width: number, height: number}) => 
            dispatch(setScreenSize({width: dimens.width, height: dimens.height}))
    }
  }
  
export default connect(mapStateToProps, mapDispatchToProps)(Game);
