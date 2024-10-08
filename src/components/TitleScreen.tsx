import React from 'react';
import '../css/TitleScreen.css';
import { AppDispatch, AppState } from '../data/store';
import { GameMode, setGameMode, reset as resetBoard, paintTile, startGame } from '../data/slices/boardSlice';
import Analytics from '../analytics';
import { connect } from 'react-redux';
import { mapStateToProps } from '../data/utils/ReactUtils';
import { DEFAULT_TICK_SPEED, MAX_TICK_SPEED, speedChange } from '../data/slices/tickerSlice';
import Map from './Map';
import { Purpose } from '../data/utils/CombatantUtils';
import Dashboard from './Dashboard';
import PaintPalette from './PaintPalette';
import { Pointer } from '../models/PointerModel';
import { PaintEntity } from '../data/slices/paintPaletteSlice';
import { Type as TileType } from '../models/TileModel';
import Setables from './Setables';

const logo = require('../images/icon.png');

const MIN_TWO_PANEL_WIDTH = 675;

class TitleScreen extends React.Component<AppState & DispatchProps> {
    keysFunction = (event: { key: string; }) => {
        const key = event.key.toUpperCase();
        if (key === "S") {
            Analytics.logEvent('key_pressed: S');
            this.props.startGame();
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keysFunction, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keysFunction, false);
    }

    render() {
        const selected_paint = this.props.paintPalette.selected;
        const selected_position = this.props.board.selected_position;

        const show_map_preview = this.props.board.view_port.width_measurement > MIN_TWO_PANEL_WIDTH;

        return (
            <div>
                {show_map_preview && <Dashboard showPause={false} showGameStats={false} showStats={false} onReset={this.props.resetBoard} />}
                <div className="TitleContainer">
                    <div className="TitleSection" style={{ width: show_map_preview ? "50%" : "100%" }}>
                        <h1 style={{ margin: "4px" }}>Welcome to</h1>
                        <div className="Setables_container">
                            <img className="Logo" src={logo} alt='logo' />
                            <Setables onReset={this.props.resetBoard} onPlay={this.props.startGame} />
                        </div>
                    </div>
                    {show_map_preview &&
                        <div className="TitleSection">
                            <div className="MapContainer">
                                <Map
                                    view_port={{ ...this.props.board.view_port, height: this.props.board.arena.height }}
                                    purpose={Purpose.Map}
                                    selectedPosition={selected_position}
                                    onTileClick={(position: number, contains_combatant: boolean) => {
                                        if (selected_paint !== Pointer.Target) {
                                            Analytics.logEvent('tap_on_board: Paint');
                                            this.props.paintOnTile({ position, type: selected_paint });
                                        }
                                    }}
                                    onTileDragEnter={(position: number) => {
                                        Analytics.logEvent('drag_on_board');
                                        if (Object.keys(TileType).includes(selected_paint)) {
                                            this.props.paintOnTile({ position, type: selected_paint });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    }
                </div>
                {show_map_preview && <PaintPalette showTarget={false} />}
            </div>
        );
    }
}

interface DispatchProps {
    startGame: () => void,
    setGameMode: (gameMode: GameMode) => void,
    resetBoard: () => void,
    paintOnTile: (paint_args: { position: number, type: PaintEntity }) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        startGame: () => dispatch(startGame()),
        setGameMode: (gameMode: GameMode) => {
            dispatch(setGameMode(gameMode));
            dispatch(speedChange({
                value: gameMode === GameMode.Adventure ? DEFAULT_TICK_SPEED : MAX_TICK_SPEED, respectPause: true
            }));
        },
        resetBoard: () => {
            Analytics.logEvent('button_click: Reset_board');
            dispatch(resetBoard());
        },
        paintOnTile: (paint_args) => {
            dispatch(paintTile(paint_args));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleScreen);
