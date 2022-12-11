import React from "react";
import '../css/Dashboard.css'
import classNames from "classnames";
import Settings from "./Settings";
import { useSelector } from "react-redux";
import { AppState } from "../data/store";

const Dashboard = ({onReset}: {onReset: () => void}) => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);

    const game_stats_section = (
        <div className="Stats_panel">
            <div className={'Row_group'}>
                <div className={'Row'}>
                    <span className={'Label'}>{'Game:'}</span>
                    <span className="Data_row">{board.game_count}</span>
                </div>
                <div className={classNames('Row')}>
                    <span className={'Label'}>{'Year:'}</span>
                    <span className="Data_row">{ticker.tick}</span>
                </div>
                <div className={classNames('Row')}>
                    <span className={'Label'}>{`Combatants:`}</span>
                    <span className="Data_row">{`${board.global_combatant_stats.num_combatants}`}</span>
                </div>
                <div className={classNames('Row')}>
                    <span className={'Label'}>{`Births:`}</span>
                    <span className="Data_row">{`${board.global_combatant_stats.births}`}</span>
                </div>
                <div className={classNames('Row')}>
                    <span className={'Label'}>{`Deaths:`}</span>
                    <span className="Data_row">{`${board.global_combatant_stats.deaths}`}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className={'Dashboard'}>
            <div style={{display: "flex", flexDirection: "row", flexGrow: "1", position: "unset", backgroundColor: "peru"}}>
                <Settings onReset={onReset}/>
                {game_stats_section}
            </div>
        </div>
    )
};

export default Dashboard;
