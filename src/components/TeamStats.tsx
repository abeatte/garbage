import classNames from "classnames";
import '../css/TeamStats.css'
import '../css/Panel.css'
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { select } from "../data/boardSlice";
import { HudDisplayMode, HudPanel, setActiveHudPanel } from "../data/hudSlice";
import { AppState } from "../data/store";
import CombatantModel, { Character } from "../models/CombatantModel";

const TeamStats = () => {
    const board = useSelector((state: AppState) => state.board);
    const hud = useSelector((state: AppState) => state.hud);
    const dispatch = useDispatch()

    const selected_position = board.selected_position;

    const teams = Object.values(Character).reduce((teams, cha) => {
        teams[cha] = []
        return teams;
    }, {} as {[key in Character]: CombatantModel[]});

    Object.values(board.combatants).forEach(combatant => {
        teams[combatant.team].push(combatant);
    });

    const counts = Object.keys(teams).map(t => {
        const team = t as Character
        const team_array = [] as JSX.Element[];
        teams[team]
            .sort((a, b) => {
                if (b.immortal) {
                    return 1;
                } else if (a.immortal) {
                    return -1;
                } else {
                    return b.fitness - a.fitness
                }
            })
            .slice(0, 10)
            .forEach((c: CombatantModel, idx: number, subset: CombatantModel[]) => {
                if (idx === 0) {
                    team_array.push(<span key={"["}>{"[ "}</span>);
                }

                team_array.push(
                    <span 
                        key={`${c.id}`}
                        className={selected_position === c.position ? "Selected" : ""} 
                        onClick={() => {                            
                            dispatch(select({position: c.position, follow_combatant: true}));
                            dispatch(setActiveHudPanel(HudPanel.DETAILS));

                        }}
                    >
                        {`${c.immortal ? Infinity : c.fitness}`}
                    </span>
                );

                if (idx < teams[team].length - 1) {
                    team_array.push(<span key={`${idx}','`}>{', '}</span>);
                }

                if (idx === teams[team].length - 1) {
                    team_array.push(<span key={"]"}>{" ]"}</span>);
                } else if (idx === subset.length - 1) {
                    team_array.push(<span key={"...]"}>{ " ... ]"}</span>);
                }
            });
        return (
            <div key={team} className={'Team_group'}>
                <span className={'Label'}>{`${team}`}</span><span>{` (${teams[team].length}):`}</span>
                <div className={classNames("Data_row", "Team", "Clickable")}>
                    {teams[team].length < 1 ? 
                        (<span>{"[ ]"}</span>) : 
                        team_array
                    }
                </div>
            </div>
        );
    }).sort((a, b) => (a.key as string).localeCompare(b.key as string));

    const isFullScreen = hud.hudDisplayMode === HudDisplayMode.FULL_SCREEN;

    const escape_button = (
        <div style={{marginTop: '7px'}}>
            <button 
                className={classNames("Clickable", "Exit")} 
                onClick={() => {
                    dispatch(setActiveHudPanel(HudPanel.NONE));
                }}
            >
            <span>{"X"}</span>
            </button>
        </div>
    );

    return (
        <div className={classNames({
            'Team_stats_fullscreen': isFullScreen,
            'Team_stats': !isFullScreen,
            'Flyout_panel': !isFullScreen, 
            'Right': !isFullScreen,
        })}>
            {isFullScreen && escape_button}
            <div className={classNames({
                'Team_stat_group_panel_container': !isFullScreen
            })}>
                <div className={'Stat_group'}>
                    <div>{counts}</div>
                </div>
            </div>
        </div>
    );
};

export default TeamStats;
