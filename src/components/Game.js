import React from 'react';
import { connect } from 'react-redux'
import { select } from '../data/boardSlice';
import { HUD_DISPLAY_MODE, setIsHudActionable } from '../data/hudSlice';
import { setScreenWidth } from '../data/hudSlice'
import Arena from './Arena';
import Hud from './Hud';

class Game extends React.Component {

    handleWindowWidthResize = (dispatch, new_width) => {
        dispatch(setScreenWidth(new_width));
    }

    escFunction = (event) => {
        if (event.key === "Escape") {
            this.props.dispatch(select());
            this.props.dispatch(setIsHudActionable(false));
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.escFunction, false);
        this.handleWindowWidthResize(this.props.dispatch, window.innerWidth);
        window.addEventListener(
            'resize', 
            () => this.handleWindowWidthResize(this.props.dispatch, window.innerWidth)
        );
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.escFunction, false);
        window.removeEventListener('resize', this.handleWindowWidthResize);
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

function mapStateToProps(state) {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
    };
}
  
export default connect(mapStateToProps)(Game);
