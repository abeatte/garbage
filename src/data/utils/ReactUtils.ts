import { AppState } from "../store";

export function mapStateToProps(state: AppState): AppState {
    return {
        ticker: state.ticker,
        board: state.board,
        hud: state.hud,
        paintPalette: state.paintPalette,
    };
}