import React from 'react';
import { connect } from 'react-redux'
// @ts-ignore
import { select } from '../data/boardSlice';
import { HUD_DISPLAY_MODE, setIsHudActionable, setScreenSize } from '../data/hudSlice';
import { AppDispatch, AppState } from '../data/store';
// @ts-ignore
import Arena from './Arena';
// @ts-ignore
import Hud from './Hud';

class Game extends React.Component<AppState> {
    props!: {
        ticker: unknown; 
        board: unknown; 
        hud: any;
        dispatch: AppDispatch; 
    };
    
    handleWindowWidthResize = (dispatch: AppDispatch, dimens: {innerWidth: number, innerHeight: number}) => {
        dispatch(setScreenSize({width: dimens.innerWidth, height: dimens.innerHeight}));
    }

    escFunction =  (event: { key: string; }) => {
        if (event.key === "Escape") {
            this.props.dispatch(select());
            this.props.dispatch(setIsHudActionable(false));
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.escFunction, false);
        this.handleWindowWidthResize(this.props.dispatch, window);
        window.addEventListener(
            'resize', 
            () => this.handleWindowWidthResize(this.props.dispatch, window)
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
  
export default connect(mapStateToProps)(Game);
