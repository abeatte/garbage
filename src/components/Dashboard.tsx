import React from "react";
import '../css/Dashboard.css'
import classNames from "classnames";
import Settings from "./Settings";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../data/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HudPanel, setActiveHudPanel } from "../data/hudSlice";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import Analytics from "../analytics";

const Dashboard = ({onReset}: {onReset: () => void}) => {
    const ticker = useSelector((state: AppState) => state.ticker);
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const dispatch = useDispatch()

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

    const show_stats_button = (
        <div className="Species_stats_button_container">
            <button 
                className={classNames('Clickable', 'Button', 'Restart')} 
                onClick={() => {
                    Analytics.logEvent(`button_click: ${hud.activeHudPanel === HudPanel.STATS ? 'Hide' : 'Show'} Stats Panel`);
                    dispatch(setActiveHudPanel(hud.activeHudPanel === HudPanel.STATS ? HudPanel.NONE : HudPanel.STATS));
            }}>
                <FontAwesomeIcon 
                    className="Clickable" 
                    icon={faChartBar} 
                    color='dark' 
                    size='lg' 
                    style={{alignSelf: 'center', margin: '10px 0px 4px 0px'}}
                />
            </button>
        </div>
    );

    return (
        <div className={'Dashboard'}>
            <div style={{display: "flex", flexDirection: "row", flexGrow: "1", position: "unset", backgroundColor: "peru"}}>
                <Settings onReset={onReset}/>
                {game_stats_section}
                {show_stats_button}
            </div>
        </div>
    )
};

export default Dashboard;
