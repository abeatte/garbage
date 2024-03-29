import React from 'react';
import { connect } from 'react-redux'
import Analytics from '../analytics';
import { select, setShowSettings } from '../data/boardSlice';
import { HudDisplayMode, HudPanel, setActiveHudPanel, setScreenSize } from '../data/hudSlice';
import { setSelectedPaint } from '../data/paintPaletteSlice';
import { AppDispatch, AppState } from '../data/store';
import { Pointer } from '../models/PointerModel';
import Arena from './Arena';
import Hud from './Hud';
import SpeciesStats from './SpeciesStats';

class Game extends React.Component<AppState & DispatchProps> {
    
    handleWindowWidthResize = (
        setScreenSize: (dimens: {width: number, height: number}) => void, 
        dimens: {innerWidth: number, innerHeight: number}
    ) => {
        setScreenSize({width: dimens.innerWidth, height: dimens.innerHeight});
    }

    escFunction =  (event: { key: string; }) => {
        if (event.key === "Escape") {
            Analytics.logEvent('key_pressed: Escape');
            // close settings panel first, if it is open. 
            if (this.props.board.show_settings) {
                this.props.setNotShowSettings();
            } else if (this.props.paintPalette.selected !== Pointer.Target) {
                this.props.setNoPaintSelected();
            } else {
                this.props.select();
                this.props.setNoActiveHudPanel();
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
        const activeHudPanel = this.props.hud.activeHudPanel === HudPanel.DETAILS ? 
            (<Hud/>) : (<SpeciesStats/>);
            
        switch(this.props.hud.hudDisplayMode) {
            case HudDisplayMode.FULL_SCREEN:
                return (
                    <>
                        {activeHudPanel}
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
                        {activeHudPanel}
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
        paintPalette: state.paintPalette,
    };
}

interface DispatchProps {
    select: () => void,
    setNoActiveHudPanel: () => void,
    setNotShowSettings: () => void,
    setNoPaintSelected: () => void,
    setScreenSize: (dimens: {width: number, height: number}) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        select: () => dispatch(select({})),
        setNoActiveHudPanel: () => dispatch(setActiveHudPanel(HudPanel.NONE)),
        setNotShowSettings: () => dispatch(setShowSettings(false)),
        setNoPaintSelected: () => dispatch(setSelectedPaint(Pointer.Target)),
        setScreenSize: (dimens: {width: number, height: number}) => 
            dispatch(setScreenSize({width: dimens.width, height: dimens.height}))
    }
  }
  
export default connect(mapStateToProps, mapDispatchToProps)(Game);
