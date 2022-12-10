import classNames from "classnames";
import '../css/TeamStats.css'
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { select } from "../data/boardSlice";
import { setIsHudActionable } from "../data/hudSlice";
import { AppState } from "../data/store";
import CombatantModel, { Character } from "../models/CombatantModel";

const TeamStats = () => {
    const board = useSelector((state: AppState) => state.board);
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
                            dispatch(setIsHudActionable(true));

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

    return (
        <div className={'Stat_group'}>
            <div>{counts}</div>
        </div>
    );
};

export default TeamStats;