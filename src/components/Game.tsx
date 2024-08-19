import React from "react";
import { AppDispatch, AppState } from "../data/store";
import { connect } from "react-redux";
import { GameMode } from "../data/slices/boardSlice";
import GameBoard from "./GameBoard";
import TitleScreen from "./TitleScreen";
import { mapStateToProps } from "../data/utils/ReactUtils";
import { setScreenSize } from "../data/slices/hudSlice";

/* eslint-disable no-fallthrough */

class Game extends React.Component<AppState & DispatchProps> {
    handleWindowWidthResize: any = (
        dimens: { innerWidth: number, innerHeight: number }
    ) => {
        this.props.setScreenSize({ width: dimens.innerWidth, height: dimens.innerHeight });
    };

    componentDidMount() {
        this.handleWindowWidthResize(this.props.setScreenSize, window);
        window.addEventListener(
            'resize',
            () => this.handleWindowWidthResize(window)
        );
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => this.handleWindowWidthResize);
    }

    render() {

        let screen;
        switch (this.props.board.game_mode) {
            case GameMode.Adventure:
            // fall-through
            case GameMode.God:
                screen = (<GameBoard />);
                break;
            case GameMode.Title:
            // fall-through
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
}

function mapDispatchToProps(dispatch: AppDispatch): DispatchProps {
    return {
        setScreenSize: (dimens: { width: number, height: number }) =>
            dispatch(setScreenSize({ width: dimens.width, height: dimens.height })),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Game);
