import React from "react";
import { AppDispatch, AppState } from "../data/store";
import { connect } from "react-redux";
import { GameMode, setGeoLocation, setViewPortSize } from "../data/slices/boardSlice";
import GameBoard from "./GameBoard";
import TitleScreen from "./TitleScreen";
import { mapStateToProps } from "../data/utils/ReactUtils";
import { setScreenSize } from "../data/slices/hudSlice";

class Game extends React.Component<AppState & DispatchProps> {
    handleWindowWidthResize = (dimens: { innerWidth: number, innerHeight: number }) => {
        this.props.setScreenSize({ width: dimens.innerWidth, height: dimens.innerHeight });
    };

    componentDidMount() {
        this.handleWindowWidthResize(window);
        window.addEventListener(
            'resize',
            () => this.handleWindowWidthResize(window)
        );
        navigator.geolocation.getCurrentPosition((position: any) => {
            this.props.setGeoLocation(position.toJSON());
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => this.handleWindowWidthResize);
    }

    render() {

        let screen;
        switch (this.props.board.game_mode) {
            case GameMode.Adventure:
            // fall-through
            /* eslint-disable-next-line no-fallthrough */
            case GameMode.God:
                screen = (<GameBoard />);
                break;
            case GameMode.Title:
            // fall-through
            /* eslint-disable-next-line no-fallthrough */
            default:
                screen = (
                    <TitleScreen />
                );
        }
        return screen;
    }
}

interface DispatchProps {
    setScreenSize: (dimens: { width: number, height: number }) => void,
    setGeoLocation: (position: GeolocationPosition) => void,
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        setScreenSize: (dimens: { width: number, height: number }) => {
            dispatch(setScreenSize(dimens));
            dispatch(setViewPortSize(dimens));
        },
        setGeoLocation: (position: GeolocationPosition) => dispatch(setGeoLocation(position)),
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Game);
